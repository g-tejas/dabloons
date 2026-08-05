# Dabloons

An API-first, AI-assisted personal accounting system backed by hledger. AI and
manual entry create editable staged transactions. A user must approve each
transaction individually before it becomes immutable accounting history.

## MVP

The current vertical slice supports:

- format-agnostic statement upload and GPT compilation;
- manual creation and editing of balanced staged transactions;
- persistent group IDs for transactions representing the same economic event;
- individual approval after prospective full-journal hledger validation;
- immutable reconciled journal batches;
- user-authorized balance assertions without documentary evidence;
- a small web review client and generated OpenAPI documentation.

## Run locally

Python 3.12+ and an `hledger` executable are required. No system-wide Python
installation is necessary.

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[dev]'
export OPENAI_API_KEY=...
uvicorn dabloons.app:app --reload
```

Open <http://127.0.0.1:8000> for the review UI or
<http://127.0.0.1:8000/docs> for the REST API.

Runtime data defaults to `./data`. Set `DABLOONS_DATA_DIR` to change it and
`DABLOONS_OPENAI_MODEL` to select the GPT model.

Transactions are stored directly as hledger journal files. Editable staged
entries use `!` under `data/ledger/staged`; approved immutable entries use `*`
under `data/ledger/reconciled`. `canonical.journal` includes only reconciled
entries, while `review.journal` includes both. Uploaded statements remain raw
files under `data/sources`; no database is required.

## Test

```bash
pytest
```

Tests use an isolated hledger process double and do not need API credentials.
