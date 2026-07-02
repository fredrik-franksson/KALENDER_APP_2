# BrainDump Voice + Text

## What this project does
You speak OR type into the app. It transcribes voice if 
used, picks out only the IMPORTANT information (drops 
filler/rambling), and returns a clean, ordered, organised 
list.

## This is the ONLY project. Do not add unrelated features.
Do not add calendar features, event scheduling, or anything
not described here. If unsure, ask before building.

## Input methods
The app supports TWO input methods, both producing plain text:
1. Voice — browser records audio, sent to transcription skill
2. Typed text — user types directly into a textarea
Both paths converge into the same pipeline below.

## Architecture
[Voice recording -> transcription skill] OR [Typed text]
  -> inputValidator hook 
  -> filterExtractor agent 
  -> formatNormaliser hook 
  -> organiser agent 
  -> ranker agent 
  -> outputFormatter skill 
  -> Result
  ## Rules for every agent file
- Each agent does ONE thing only
- Agents never call each other directly
- All agents live in src/agents/
- All hooks live in src/hooks/
- All skills live in src/skills/
- Pipeline is wired in src/pipeline/run.js

## Frontend requirements
- One textarea for typing
- One microphone button for recording
- Both submit to the same backend endpoint: POST /api/process
- The endpoint accepts EITHER a "text" field OR an audio file
- If audio is present, transcribe it first, then run the 
  same pipeline as typed text

## Stack
- Node.js with ES modules
- Anthropic SDK (@anthropic-ai/sdk)
- Express for the API server
- Vanilla HTML/CSS/JS for the frontend (MediaRecorder API)
- No frameworks, no databases
## Output format
Final output is always a markdown string with:
- Group headers (## Topic name)
- Ordered list items (1. Item, 2. Item)
- Most important items appear first within each group