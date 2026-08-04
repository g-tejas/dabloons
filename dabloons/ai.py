from __future__ import annotations

from pathlib import Path
from typing import Protocol

from openai import OpenAI

from .models import AICompilation


class StatementCompiler(Protocol):
    def compile(
        self,
        source: Path,
        *,
        filename: str,
        media_type: str,
        target_account: str,
        default_commodity: str,
    ) -> AICompilation: ...


class GPTStatementCompiler:
    def __init__(self, model: str = "gpt-5") -> None:
        self.client = OpenAI()
        self.model = model

    def compile(
        self,
        source: Path,
        *,
        filename: str,
        media_type: str,
        target_account: str,
        default_commodity: str,
    ) -> AICompilation:
        uploaded = self.client.files.create(
            file=(filename, source.read_bytes(), media_type),
            purpose="user_data",
        )
        try:
            response = self.client.responses.parse(
                model=self.model,
                input=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_file", "file_id": uploaded.id},
                            {
                                "type": "input_text",
                                "text": (
                                    "Transcribe every financial transaction in this file, then "
                                    "propose balanced double-entry postings. Do not omit uncertain "
                                    "rows: include the best staged proposal and add a warning. "
                                    f"The tracked account is {target_account!r}; use "
                                    f"{default_commodity!r} unless the source clearly says otherwise. "
                                    "Use precise decimal values, never floats. These are only staged "
                                    "proposals and a human will review each one."
                                ),
                            },
                        ],
                    }
                ],
                text_format=AICompilation,
            )
            if response.output_parsed is None:
                raise RuntimeError("GPT returned no structured compilation")
            return response.output_parsed
        finally:
            self.client.files.delete(uploaded.id)
