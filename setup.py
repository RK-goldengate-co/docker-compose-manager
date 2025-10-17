#!/usr/bin/env python3
"""
Setup configuration for Docker Compose Manager
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read the contents of README file
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8")

# Read requirements
with open("requirements.txt") as f:
    requirements = [line.strip() for line in f if line.strip() and not line.startswith("#")]

setup(
    name="docker-compose-manager",
    version="0.1.0",
    author="RK-goldengate-co",
    description="A powerful CLI tool for managing Docker Compose projects",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/RK-goldengate-co/docker-compose-manager",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: System Administrators",
        "Topic :: Software Development :: Build Tools",
        "Topic :: System :: Systems Administration",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "dcm=main:main",
        ],
    },
    keywords="docker docker-compose devops deployment automation",
    project_urls={
        "Bug Reports": "https://github.com/RK-goldengate-co/docker-compose-manager/issues",
        "Source": "https://github.com/RK-goldengate-co/docker-compose-manager",
    },
)
