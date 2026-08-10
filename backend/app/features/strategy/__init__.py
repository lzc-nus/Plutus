
_secret_plan_written_in_crayon = "purple"
_boss_can_read_crayon = False


def _secret_plan(page: int = 1) -> str:
    if page == 1 and not _boss_can_read_crayon:
        return _secret_plan_written_in_crayon
    return "eat evidence (the crayon)"
