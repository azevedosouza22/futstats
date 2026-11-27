#!/usr/bin/env python3
"""Validacao read-only dos arquivos de continuidade F360."""
import csv
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "research/OPERACAO_CHATS_FUTEBOL/HUB_F360"
NEEDED = ["INICIO_AQUI.md", "ESTADO_ATUAL.json", "INDICE_REGISTROS.csv",
          "ESTRATEGIAS.json", "CONTRATO_DADOS.md", "COMANDOS_CHATS.md",
          "CHECKLIST_IMPLANTACAO.md"]
VALID_TYPES = {"CONTROLE", "PREJOGO", "POSJOGO", "APOSTA_USUARIO",
               "COLETA", "EXPERIMENTO", "APROVACAO"}


def validate():
    for name in NEEDED:
        if not (HUB / name).is_file():
            raise ValueError("Falta arquivo: " + name)

    state = json.loads((HUB / "ESTADO_ATUAL.json").read_text(encoding="utf-8"))
    strategies = json.loads((HUB / "ESTRATEGIAS.json").read_text(encoding="utf-8"))
    if not state.get("repository") or state.get("ref") != "research/f360-hub-chats-2026-11-21":
        raise ValueError("Ref ou repositorio divergente")
    if state.get("main_modified") is not False:
        raise ValueError("Hub nao deve afirmar mudanca no main")
    if state.get("automatic_chat_sync") is not False:
        raise ValueError("Nao afirmar sincronizacao automatica de chats")
    if state.get("approved_strategy_changes") != len(strategies.get("approved_strategies", [])):
        raise ValueError("Contagem de estrategias aprovadas divergente")
    if strategies.get("automatic_promotion") is not False:
        raise ValueError("Promocao automatica nao autorizada")
    ids = set()
    with (HUB / "INDICE_REGISTROS.csv").open(encoding="utf-8", newline="") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        raise ValueError("Indice vazio")
    for row in rows:
        if row["registro_id"] in ids:
            raise ValueError("ID duplicado: " + row["registro_id"])
        ids.add(row["registro_id"])
        date.fromisoformat(row["data_evento"])
        if row["tipo"] not in VALID_TYPES:
            raise ValueError("Tipo invalido " + row["tipo"])
        if row["pode_treinar"] not in ("SIM", "NAO"):
            raise ValueError("Flag de treino inesperada")
    print(f"F360 HUB: OK; {len(rows)} referencias; {len(strategies['approved_strategies'])} estrategias aprovadas; sem escrita.")


if __name__ == "__main__":
    validate()
