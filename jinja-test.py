#!/usr/bin/env python
import os
from unittest.mock import MagicMock

import jinja2


class TestObj:
    @property
    def b(self):
        return self

    @property
    def c(self):
        return self

    @property
    def d(self):
        return self

    def fn(self, *args, **kwargs):
        return "obj.fn()"

    def __call__(self, *args, **kwargs):
        return self


def fn():
    return "fn()"


this_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.join(this_dir, "examples")),
    extensions=[
        "jinja2.ext.DebugExtension",
        "jinja2.ext.ExprStmtExtension",
        "jinja2.ext.LoopControlExtension",
        "jinja2.ext.InternationalizationExtension",
    ],
)
template = env.get_template("playground.html.j2")
a = MagicMock()
print(
    template.render(
        {
            "a": a,
            "fn": a,
            "obj": a,
            "user": {"name": "Alex", "profile": {"birthdate": 2000}},
        }
    )
)
