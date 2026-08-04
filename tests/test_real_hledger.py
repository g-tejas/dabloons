from __future__ import annotations

import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from dabloons.app import create_app


@pytest.mark.skipif(shutil.which("hledger") is None, reason="hledger is not installed")
def test_existing_watermark_rejects_an_old_dated_promotion(tmp_path: Path) -> None:
    api = TestClient(create_app(data_dir=tmp_path))
    opening = api.post(
        "/v1/staged-transactions",
        json={
            "date": "2026-08-01",
            "payee": "Opening balance",
            "postings": [
                {
                    "account": "assets:bank:checking",
                    "commodity": "USD",
                    "quantity": "100.00",
                },
                {
                    "account": "equity:opening",
                    "commodity": "USD",
                    "quantity": "-100.00",
                },
            ],
        },
    ).json()
    assert (
        api.post(f"/v1/staged-transactions/{opening['id']}/approve").status_code
        == 200
    )
    assert (
        api.post(
            "/v1/watermarks",
            json={
                "account": "assets:bank:checking",
                "date": "2026-08-04",
                "commodity": "USD",
                "balance": "100.00",
            },
        ).status_code
        == 201
    )

    old_transaction = api.post(
        "/v1/staged-transactions",
        json={
            "date": "2026-08-02",
            "payee": "Late old expense",
            "postings": [
                {
                    "account": "assets:bank:checking",
                    "commodity": "USD",
                    "quantity": "-1.00",
                },
                {
                    "account": "expenses:misc",
                    "commodity": "USD",
                    "quantity": "1.00",
                },
            ],
        },
    ).json()
    rejected = api.post(
        f"/v1/staged-transactions/{old_transaction['id']}/approve"
    )
    assert rejected.status_code == 409
    assert "balance assertion failed" in rejected.json()["detail"].lower()
    assert (
        api.get(f"/v1/transactions/{old_transaction['id']}").json()["state"]
        == "staged"
    )
