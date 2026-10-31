# 🏆 Jurychain

**Trustless competitions with cryptographic judging.**

Jurychain is a decentralized competition platform that enables sponsors to host competitions, participants to submit projects, and judges to vote anonymously using Zero-Knowledge (ZK) proofs. Prize funds are secured in smart contract escrow and automatically distributed to winners, ensuring transparency, fairness, and trustless execution.

---

## 1. 🏠 Homepage

**Purpose:** Explain the protocol and showcase active competitions.

### 🎯 Hero Section
- **Tagline:** "Trustless competitions with cryptographic judging"
- Connect Wallet button.

### 🏅 Active Competitions
Display the following information for each active competition:
- Competition title
- Prize pool
- Number of judges
- Submission deadline

### ⚙️ How It Works
Explain the platform in three simple steps.

### 📊 Stats Dashboard
Display:
- Total prize distributed
- Number of competitions
- Number of judges

### ✨ Features
- Browse competitions.
- View competition details without logging in.
- Connect wallet.

---

## 2. 📝 Create Competition (Sponsors / Organizers)

Sponsors and organizers can create and manage competitions through this section.

### 📋 Fields
- Competition title
- Description
- Prize pool amount
- Number of winners
- Submission deadline
- Voting deadline
- Judge list (wallet addresses or commitments)

### 🔐 Competition Options
- **Public Competition:** Open for everyone to participate.
- **Private Competition:** Invite-only access.

### ✨ Features
- Deposit prize funds into a smart contract escrow.
- Generate a judge Merkle tree.
- Publish the competition.

### 🔄 User Flow

```text
Sponsor → Create Competition
        ↓
Sponsor → Deposit Prize
        ↓
Smart Contract → Escrow Funds
        ↓
Competition Goes Live
```

---

## 3. 🏆 Competition Page

Every competition has its own dedicated page.

### 📌 Sections

**Overview**
- Competition description
- Rules
- Prize distribution

**Timeline**
- Submission phase
- Voting phase
- Results phase

**Judges**
- Display the total number of judges without revealing their identities.

**Prize Pool**
- Display funds locked in smart contract escrow.

### ✨ Features
- Submit projects.
- View participants.
- Track the competition timeline.
- Verify escrow funds.

---

## 4. 📤 Submit Project

Participants can submit their projects to active competitions.

### 📋 Submission Fields
- Project name
- Project description
- GitHub link
- Demo link
- Optional files

### 📁 File Storage
Submission files are stored on:
- IPFS

### ✨ Features
- Upload submissions.
- Edit submissions before the deadline.
- Optionally view other participants' submissions.

### 🔄 Submission Flow

```text
Participant → Submit Project
        ↓
Submission Stored on IPFS
        ↓
Submission Hash Stored on Blockchain
```

---

## 5. ⚖️ Judge Dashboard

The Judge Dashboard is accessible only to approved judges.

### ✨ Features
- Anonymous identity creation.
- View project submissions.
- Vote securely.

### 🔐 Identity Setup

Judges create a commitment-based anonymous identity.

**Example:**

```javascript
identity = hash(secret + wallet)
```

The identity commitment is stored in a Merkle tree.

### 📄 Submission Review

Judges can view:
- Project details
- Demo links
- Scoring system

### 🗳️ Possible Voting Styles
- **Ranking:** Rank projects based on preference.
- **Score:** Assign scores from 1–10.
- **Pick Winner:** Select the winning project.

### 🔒 Secure Voting

When a judge selects a project:

1. A ZK proof is generated.
2. The vote is submitted.
3. The proof is verified.

### 🛠️ Technologies
- Semaphore
- SnarkJS

### ✅ Proof Verification

The system verifies that:
- The judge is valid.
- The judge has not voted twice.
- The judge's identity remains hidden.

---

## 6. 🗳️ Voting Phase

During this phase, approved judges submit their votes securely.

### 🔄 Voting Mechanism

**Commit Phase**

```javascript
commit = hash(vote + secret)
```

**Reveal Phase**

The judge submits the vote along with the secret to reveal the committed vote.

### ✨ Features
- Vote submission.
- Vote verification.
- Anti-double-voting mechanism.

---

## 7. 🧮 Result Computation

Once the voting phase ends, the smart contract handles result computation.

### ⚙️ Process
1. Smart contract verifies votes.
2. Calculates the winner.
3. Releases the prize.

### 🔄 Automatic Result Flow

```text
Voting Ends
    ↓
Smart Contract Calculates Result
    ↓
Prize Released Automatically
```

No manual organizer intervention is required.

---

## 8. 💰 Prize Distribution

Prize distribution is the trustless part of Jurychain.

### 🏅 Prize Distribution Page

Displays:
- Winners
- Vote counts
- Proof verification status

### ✨ Features
- Automatic fund transfers.
- Transparent prize distribution.
- Smart contract-based execution.

### 🔄 Prize Distribution Flow

```text
      Escrow Contract
             ↓
     Winner Wallet Receives Prize
```

Funds are automatically transferred to the winners without organizer intervention.

---

## 9. 🔍 Transparency Explorer

The Transparency Explorer allows users to independently verify competition activities.

### ✅ Users Can Verify
- Prize escrow.
- Vote commitments.
- ZK proof validity.

### 📊 Explorer Sections
- Competitions
- Votes
- Proofs
- Transactions

Think of it as a mini blockchain explorer that provides transparency into Jurychain's operations.

---

## 10. 👤 User Profile

Users can track their activity and achievements through their profiles.

### 📌 Profile Sections
- Competitions created.
- Competitions joined.
- Submissions.
- Prizes won.

### ✨ Features
- Wallet-based login.
- Reputation score.

---

## 👥 Platform Roles

### 🏢 Sponsor / Organizer

Can:
- Create competitions.
- Deposit prize funds.
- Invite judges.

### 🚀 Participant

Can:
- Join competitions.
- Submit projects.
- Track results.

### ⚖️ Judge

Can:
- Review submissions.
- Vote anonymously.

---

## 🔄 Full Platform Flow

```text
Sponsor Creates Competition
            ↓
Prize Deposited Into Escrow
            ↓
Participants Submit Projects
            ↓
Judges Review Submissions
            ↓
Judges Vote Anonymously Using ZK
            ↓
Smart Contract Calculates Winner
            ↓
Prize Automatically Distributed
```

---

## 🛠️ Core Technologies

| Technology | Purpose |
|---|---|
| Smart Contracts | Competition management and prize escrow |
| IPFS | Decentralized submission storage |
| Merkle Tree | Judge commitment management |
| Zero-Knowledge Proofs | Anonymous judge verification |
| Semaphore | Anonymous identity and membership proofs |
| SnarkJS | ZK proof generation and verification |
| Blockchain | Transparent and verifiable transactions |

---

**🏆 Jurychain — Trustless Competitions. Anonymous Judging. Transparent Rewards.**
