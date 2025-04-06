import pytest


def pytest_configure(config):
    # Add a marker for incremental tests
    config.addinivalue_line(
        "markers",
        "incremental: mark a test class as incremental so that remaining tests are xfailed after one failure"
    )


def pytest_runtest_makereport(item, call):
    # If any test in an "incremental" class fails, remember it
    if "incremental" in item.keywords:
        if call.excinfo is not None:
            parent = item.parent
            parent._previousfailed = item


def pytest_runtest_setup(item):
    # Before each test, check if a previous one in this class failed
    previousfailed = getattr(item.parent, "_previousfailed", None)
    if previousfailed is not None:
        # skip this test as xfail
        pytest.xfail(f"previous test failed ({previousfailed.name})")
