1️⃣ Homepage

Purpose: Explain the protocol and show active competitions.

Sections

Hero section

“Trustless competitions with cryptographic judging”

Connect wallet button

Active competitions list

title

prize pool

number of judges

submission deadline

How it works (3 steps)

Stats dashboard

total prize distributed

number of competitions

number of judges

Features:

Browse competitions

View details without logging in

Connect wallet

2️⃣ Create Competition (For Sponsors / Organizers)

Users who want to host a competition go here.

Fields

Competition title

Description

Prize pool amount

Number of winners

Submission deadline

Voting deadline

Judge list (wallet addresses or commitments)

Options

Public competition

Private competition (invite-only)

Features:

Deposit prize into escrow smart contract

Generate judge Merkle tree

Publish competition

User Flow

Sponsor → Create Competition
Sponsor → Deposit Prize
Smart Contract → Escrow funds
Competition goes live
3️⃣ Competition Page

Every competition has its own page.

Sections

Overview

description

rules

prize distribution

Timeline

submission phase

voting phase

results phase

Judges

shows number of judges (not identities)

Prize Pool

shows locked funds in escrow

Features

submit project

see participants

see timeline

verify escrow

4️⃣ Submit Project

Participants submit their entry.

Fields

project name

project description

GitHub link

demo link

optional files

Files stored in:

IPFS

Features

upload submission

edit before deadline

view other submissions (optional)

Flow

Participant → Submit project
Submission stored on IPFS
Hash stored on blockchain
5️⃣ Judge Dashboard

Only accessible to approved judges.

Features

anonymous identity creation

view submissions

vote securely

Sections

Identity Setup

Judge creates commitment identity

Example:

identity = hash(secret + wallet)

Stored in Merkle tree.

Submission Review

Judges see

project details

demo

score system

Possible voting styles

ranking

score (1–10)

pick winner

Secure Voting

When voting:

Judge selects project

ZK proof generated

Vote submitted

Using tools like

Semaphore

SnarkJS

Proof verifies

judge is valid

judge hasn't voted twice

But identity stays hidden.

6️⃣ Voting Phase

During this phase:

judges submit votes

votes are committed

Mechanism

Commit phase

commit = hash(vote + secret)

Reveal phase

vote + secret submitted

Features

vote submission

vote verification

anti double voting

7️⃣ Result Computation

Once voting ends:

Smart contract

verifies votes

calculates winner

releases prize

Automatic process.

Flow

Voting ends
Smart contract calculates result
Prize released automatically
8️⃣ Prize Distribution

This is the trustless part.

Prize distribution page shows:

winners

vote counts

proof verification

Funds automatically sent.

Example

Escrow Contract
     ↓
Winner wallet receives prize

No organizer intervention needed.

9️⃣ Transparency Explorer

This is a very impressive feature for judges.

Users can verify:

prize escrow

vote commitments

ZK proof validity

Explorer sections

competitions

votes

proofs

transactions

Think of it like a mini blockchain explorer.

🔟 User Profile

Users can track their activity.

Sections

competitions created

competitions joined

submissions

prizes won

Features

wallet based login

reputation score

Platform Roles
Sponsor / Organizer

Can:

create competitions

deposit prize

invite judges

Participant

Can:

join competitions

submit projects

track results

Judge

Can:

review submissions

vote anonymously

Full Platform Flow
Sponsor creates competition
        ↓
Prize deposited into escrow
        ↓
Participants submit projects
        ↓
Judges review submissions
        ↓
Judges vote anonymously with ZK
        ↓
Smart contract calculates winner
        ↓
Prize automatically distributed