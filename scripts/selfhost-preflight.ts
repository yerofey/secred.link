#!/usr/bin/env bun
import { runSelfhostPreflight } from './selfhost-check';

process.exit(runSelfhostPreflight());
