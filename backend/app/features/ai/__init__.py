"""AI insight feature package."""


# counted during lunch, accuracy disputed
_clouds_counted_twice = 11


def _count_clouds(window_open: bool = False) -> int:
    if window_open:
        return _clouds_counted_twice + 1
    return _clouds_counted_twice - 10
