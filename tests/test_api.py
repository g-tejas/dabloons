from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from dabloons.app import create_app
from dabloons.models import AICompilation, AITransaction, PostingInput


class FakeCompiler:
    def compile(self, source: Path, **context: str) -> AICompilation:
        assert source.read_text() == "2026-08-01,Coffee,-4.50"
        assert context["target_account"] == "assets:bank:checking"
        return AICompilation(
            transactions=[
                AITransaction(
                    date="2026-08-01",
                    payee="Coffee",
                    postings=[
                        PostingInput(
                            account="expenses:food",
                            commodity="USD",
                            quantity="4.50",
                        ),
                        PostingInput(
                            account="assets:bank:checking",
                            commodity="USD",
                            quantity="-4.50",
                        ),
                    ],
                    source_reference="row 1",
                )
            ]
        )


def fake_hledger(tmp_path: Path) -> str:
    executable = tmp_path / "hledger"
    executable.write_text("#!/bin/sh\nexit 0\n")
    executable.chmod(0o755)
    return str(executable)


def client(tmp_path: Path) -> TestClient:
    return TestClient(
        create_app(
            data_dir=tmp_path / "data",
            compiler=FakeCompiler(),
            hledger_executable=fake_hledger(tmp_path),
        )
    )


def test_upload_compile_edit_and_individually_approve(tmp_path: Path) -> None:
    api = client(tmp_path)
    uploaded = api.post(
        "/v1/statements",
        files={"source": ("statement.csv", b"2026-08-01,Coffee,-4.50", "text/csv")},
    )
    assert uploaded.status_code == 201

    compiled = api.post(
        f"/v1/statements/{uploaded.json()['id']}/compile",
        json={
            "target_account": "assets:bank:checking",
            "default_commodity": "USD",
        },
    )
    assert compiled.status_code == 200
    staged = compiled.json()["transactions"][0]
    assert staged["state"] == "staged"

    edited = {
        "date": staged["date"],
        "payee": "Neighborhood Coffee",
        "note": "Reviewed manually",
        "postings": staged["postings"],
        "statement_id": staged["statement_id"],
        "source_reference": staged["source_reference"],
    }
    updated = api.patch(
        f"/v1/staged-transactions/{staged['id']}",
        json={"expected_revision": 1, "transaction": edited},
    )
    assert updated.status_code == 200
    assert updated.json()["revision"] == 2

    approved = api.post(f"/v1/staged-transactions/{staged['id']}/approve")
    assert approved.status_code == 200
    assert approved.json()["state"] == "reconciled"
    assert approved.json()["approved_at"]
    batch = tmp_path / "data" / "ledger" / "reconciled" / f"{staged['id']}.journal"
    assert "Neighborhood Coffee" in batch.read_text()

    immutable = api.patch(
        f"/v1/staged-transactions/{staged['id']}",
        json={"expected_revision": 2, "transaction": edited},
    )
    assert immutable.status_code == 409


def test_manual_transaction_must_balance(tmp_path: Path) -> None:
    api = client(tmp_path)
    response = api.post(
        "/v1/staged-transactions",
        json={
            "date": "2026-08-01",
            "payee": "Broken entry",
            "postings": [
                {
                    "account": "assets:bank:checking",
                    "commodity": "USD",
                    "quantity": "-10.00",
                },
                {
                    "account": "expenses:unknown",
                    "commodity": "USD",
                    "quantity": "9.00",
                },
            ],
        },
    )
    assert response.status_code == 422


def test_user_can_create_watermark_without_evidence(tmp_path: Path) -> None:
    api = client(tmp_path)
    response = api.post(
        "/v1/watermarks",
        json={
            "account": "assets:bank:checking",
            "date": "2026-08-04",
            "commodity": "USD",
            "balance": "123.45",
        },
    )
    assert response.status_code == 201
    watermark = response.json()
    batch = tmp_path / "data" / "ledger" / "reconciled" / f"{watermark['id']}.journal"
    assert "0 USD = 123.45 USD" in batch.read_text()
    assert "statement" not in batch.read_text()

    same_day = api.post(
        "/v1/watermarks",
        json={
            "account": "assets:bank:checking",
            "date": "2026-08-04",
            "commodity": "USD",
            "balance": "123.45",
        },
    )
    assert same_day.status_code == 409


def test_missing_hledger_rejects_approval_and_keeps_transaction_staged(
    tmp_path: Path,
) -> None:
    api = TestClient(
        create_app(
            data_dir=tmp_path / "data",
            compiler=FakeCompiler(),
            hledger_executable=str(tmp_path / "not-installed-hledger"),
        )
    )
    staged = api.post(
        "/v1/staged-transactions",
        json={
            "date": "2026-08-04",
            "payee": "Safe failure",
            "postings": [
                {
                    "account": "assets:bank:checking",
                    "commodity": "USD",
                    "quantity": "-5.00",
                },
                {
                    "account": "expenses:misc",
                    "commodity": "USD",
                    "quantity": "5.00",
                },
            ],
        },
    ).json()

    rejected = api.post(f"/v1/staged-transactions/{staged['id']}/approve")

    assert rejected.status_code == 409
    assert "is not installed" in rejected.json()["detail"]
    assert (
        api.get(f"/v1/transactions/{staged['id']}").json()["state"] == "staged"
    )
    assert not list((tmp_path / "data" / "ledger" / "reconciled").glob("*.journal"))
