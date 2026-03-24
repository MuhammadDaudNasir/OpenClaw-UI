#!/bin/bash
cd "$(dirname "$0")"
exec bash ./commands/deploy.command "$@"
