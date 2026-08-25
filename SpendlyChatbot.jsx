import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, CreditCard, LifeBuoy, ShieldCheck } from "lucide-react";

/* ============================================================================
   SPENDLY ASSISTANT — floating FAQ chatbot
   Single-file, production-ready React component.
   - Client-side fuzzy-match engine over a bundled knowledge base
   - Falls back to a "contact support" path when confidence is low
   - No external network calls
   ============================================================================ */

/* ---------------------------------------------------------------------------
   1. THEME
   Palette pulls from a physical business card: steel-navy body, brass foil
   accent, mint "approved" signal. Avoids the usual cream/terracotta and
   near-black/acid-green defaults.
--------------------------------------------------------------------------- */
const THEME = {
  ink: "#161A24",
  navy: "#232A3D",
  navyDeep: "#171C2A",
  paper: "#F5F6F8",
  card: "#FFFFFF",
  brass: "#C9A227",
  brassSoft: "#E9D68C",
  mint: "#2FA88A",
  mintSoft: "#E4F5EF",
  line: "#E4E6EC",
  textMuted: "#6B7180",
  danger: "#C4553D",
  fontDisplay: "'Space Grotesk', 'Segoe UI', sans-serif",
  fontBody: "'Inter', 'Segoe UI', sans-serif",
  fontMono: "'IBM Plex Mono', 'Courier New', monospace",
};

/* ---------------------------------------------------------------------------
   2. KNOWLEDGE BASE
   Curated from Spendly's Getting Started / Cards & Transactions / Billing &
   Security FAQs. Each entry carries extra keyword synonyms to widen recall
   for the fuzzy matcher.
--------------------------------------------------------------------------- */
const KB = [
  {
    id: "reset-password",
    category: "Security",
    question: "How do I reset my password?",
    keywords: ["reset password", "forgot password", "password reset", "cant log in", "can't sign in", "login issue", "locked out"],
    answer:
      "On the sign-in page, select **Forgot password**, then enter the email tied to your Spendly account. If it matches, you'll get a reset link — it expires after a short window and can only be used once. Too many failed sign-in attempts will also trigger a temporary lock; you can wait it out or reset your password to get back in.",
  },
  {
    id: "freeze-lost-card",
    category: "Cards",
    question: "What should I do if my card is lost?",
    keywords: ["lost card", "stolen card", "freeze card", "misplaced card", "card missing", "card theft"],
    answer:
      "Freeze it right away from the mobile app: **Cards → select the card → Freeze**. Freezing is temporary and reversible, so it's the right first move if the card might just be misplaced. If it's genuinely gone for good, report it as lost and request a replacement — that permanently cancels it.",
  },
  {
    id: "declined-transaction",
    category: "Transactions",
    question: "Why was my transaction declined?",
    keywords: ["declined", "transaction failed", "card declined", "payment declined", "purchase failed", "card not working"],
    answer:
      "Usually one of: the card is frozen, a spending limit was hit, the merchant category is blocked, the amount tops the per-transaction limit, the card expired, or unusual activity was flagged. Open the declined transaction in the app — it shows the specific reason.",
  },
  {
    id: "invite-employee",
    category: "Getting Started",
    question: "How do I invite an employee?",
    keywords: ["invite employee", "add employee", "add user", "invite user", "new employee", "onboard employee"],
    answer:
      "From the dashboard, go to **People → Invite employee**, enter their name and work email, choose a role, and optionally assign a card or spending policy. They'll get an email to activate their account.",
  },
  {
    id: "spending-limits",
    category: "Cards",
    question: "What spending limits can I set?",
    keywords: ["spending limit", "set limit", "limits", "daily limit", "monthly limit", "per transaction limit", "card limit"],
    answer:
      "You can configure per-transaction, daily, weekly, monthly, and (for temporary cards) total lifetime limits — a single card can carry more than one at once. Employees can request a higher limit in-app if you've enabled that; an admin approves or rejects it.",
  },
  {
    id: "pending-transaction",
    category: "Transactions",
    question: "Why is my transaction still pending?",
    keywords: ["pending transaction", "pending charge", "authorization pending", "not settled", "still processing"],
    answer:
      "It's been authorized but not yet settled by the merchant — most clear in one to three business days. Hotels, fuel stations, and car rentals often hold authorizations longer, and the final settled amount can differ from the original hold. Still pending after seven days? Contact support for a review.",
  },
  {
    id: "virtual-card",
    category: "Getting Started",
    question: "How do I create a virtual card?",
    keywords: ["create virtual card", "new virtual card", "issue card", "make a card", "add a card"],
    answer:
      "Go to **Cards → Create card**, pick the employee, choose **Virtual Card**, and set the spending policy. Virtual cards are usually ready to use immediately.",
  },
  {
    id: "physical-card-delivery",
    category: "Getting Started",
    question: "How long does a physical card take to arrive?",
    keywords: ["physical card delivery", "card arrival", "shipping time", "when will my card arrive"],
    answer:
      "Standard delivery is typically five to seven business days. Express delivery may be available in some locations for an extra fee — the estimate is shown before you confirm the order.",
  },
  {
    id: "user-roles",
    category: "Getting Started",
    question: "What user roles does Spendly support?",
    keywords: ["user roles", "account owner", "finance admin", "employee role", "permissions", "roles"],
    answer:
      "Three: **Account Owner** (full access, including billing and ownership transfer), **Finance Admin** (manages employees, cards, policies, and exports — but can't transfer ownership), and **Employee** (sees only their own cards, transactions, and receipts).",
  },
  {
    id: "two-factor",
    category: "Security",
    question: "Does Spendly support two-factor authentication?",
    keywords: ["two factor", "2fa", "mfa", "authenticator", "extra security"],
    answer:
      "Yes — 2FA can be enabled per user, and Account Owners can require it organization-wide. Depending on setup, sign-ins can be verified with an authenticator app or another supported method.",
  },
  {
    id: "unfamiliar-transaction",
    category: "Security",
    question: "I see an unfamiliar transaction — what do I do?",
    keywords: ["unfamiliar transaction", "fraud", "suspicious charge", "don't recognize charge", "unauthorized transaction"],
    answer:
      "First check the merchant name, date, and amount — sometimes a known merchant bills under a different name. Still not ringing a bell? Freeze the card and report the transaction in the app. That opens an investigation; a refund isn't guaranteed and depends on the outcome and card-network rules.",
  },
  {
    id: "refund",
    category: "Transactions",
    question: "How are refunds handled?",
    keywords: ["refund", "money back", "reimbursement time", "refund status"],
    answer:
      "Refunds show up as a separate transaction, usually within five to ten business days after the merchant processes them. Spendly can't speed up a refund the merchant hasn't submitted yet.",
  },
  {
    id: "invoices",
    category: "Billing",
    question: "Can I download previous invoices?",
    keywords: ["download invoice", "invoice history", "past invoices", "billing history", "receipts for billing"],
    answer:
      "Yes — Account Owners can grab them from **Settings → Billing → Invoices** as PDFs, including the billing period, charges, taxes, and payment status.",
  },
  {
    id: "payment-failed",
    category: "Billing",
    question: "What happens if my subscription payment fails?",
    keywords: ["payment failed", "subscription payment failed", "billing failed", "invoice failed"],
    answer:
      "Spendly retries automatically and emails the Account Owner about the failed attempt. If it keeps failing, the workspace can enter a restricted state — new card creation and some admin actions get disabled — but existing cards aren't cancelled after just one failed payment.",
  },
  {
    id: "merchant-restriction",
    category: "Cards",
    question: "Can I restrict which merchants a card can be used at?",
    keywords: ["restrict merchant", "block merchant category", "merchant category limits", "block a store"],
    answer:
      "Yes — policies can allow or block whole categories (travel, restaurants, software, fuel, entertainment, cash withdrawal, etc.), and individual merchants can be blocked after the fact too, as long as the card network passes along enough merchant detail.",
  },
  {
    id: "employee-leaves",
    category: "Getting Started",
    question: "What happens if an employee leaves the company?",
    keywords: ["employee leaves", "offboard employee", "deactivate employee", "remove employee", "employee quit"],
    answer:
      "Deactivate them from **People**. That disables their login, freezes their active cards, and blocks new transactions — but their transaction history and attached receipts stay visible to finance admins. They can be reactivated later if needed.",
  },
  {
    id: "export-transactions",
    category: "Billing",
    question: "Can I export transaction data?",
    keywords: ["export transactions", "csv export", "download transactions", "export data"],
    answer:
      "Finance Admins and Account Owners can export from the dashboard, filtered by date range, employee, card, category, or status. CSV export is available on every business plan.",
  },
  {
    id: "contact-support",
    category: "Support",
    question: "How do I contact support?",
    keywords: ["contact support", "talk to a human", "customer service", "help desk", "support team", "real person"],
    answer:
      "Open **Help** in the dashboard or mobile app. Standard support runs during business hours; priority support may be available on higher-tier plans. Have the transaction date, amount, employee name, and last four card digits ready — and never send a full card number, password, or one-time code, even to support.",
  },
];

const QUICK_REPLY_IDS = ["reset-password", "freeze-lost-card", "declined-transaction", "invite-employee"];

const SUPPORT_FALLBACK =
  "I don't have a confident answer for that one. You can open **Help** in the Spendly dashboard or app to reach the support team — standard support runs during business hours, with priority support on some plans. Just don't share your password, a one-time code, or a full card number, even with support.";

/* ---------------------------------------------------------------------------
   3. FUZZY MATCH ENGINE
   Lightweight, dependency-free: token overlap + Jaccard similarity + a
   bounded Levenshtein pass for typo tolerance on short words, plus a
   substring bonus for multi-word keyword phrases.
--------------------------------------------------------------------------- */
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "can", "could",
  "how", "what", "why", "when", "where", "who", "to", "for", "of", "on", "in", "at",
  "my", "i", "my", "it", "its", "and", "or", "with", "please", "hi", "hello", "hey",
]);

function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length,
    n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

function fuzzyTokenMatch(qToken, entryTokens) {
  for (const t of entryTokens) {
    if (t === qToken) return 1;
    if (t.includes(qToken) || qToken.includes(t)) return 0.7;
    if (Math.min(t.length, qToken.length) >= 4 && levenshtein(qToken, t) <= 1) return 0.6;
  }
  return 0;
}

// Precompute searchable token sets for the KB once.
const KB_INDEX = KB.map((entry) => {
  const haystack = [entry.question, ...entry.keywords].join(" ");
  return {
    ...entry,
    tokens: Array.from(new Set(tokenize(haystack))),
    phraseHaystack: haystack.toLowerCase(),
  };
});

function findBestAnswer(query) {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const entry of KB_INDEX) {
    let overlap = 0;
    for (const qt of qTokens) overlap += fuzzyTokenMatch(qt, entry.tokens);

    const recall = overlap / qTokens.length;
    const precision = overlap / Math.max(entry.tokens.length, 1);
    let score = recall * 0.65 + precision * 0.35;

    // Bonus: whole keyword phrase appears verbatim in the query.
    for (const kw of entry.keywords) {
      if (kw.length > 4 && query.toLowerCase().includes(kw)) {
        score += 0.25;
        break;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  const CONFIDENCE_THRESHOLD = 0.32;
  if (!best || bestScore < CONFIDENCE_THRESHOLD) return null;
  return { entry: best, score: bestScore };
}

/* ---------------------------------------------------------------------------
   4. SMALL HELPERS
--------------------------------------------------------------------------- */
let msgCounter = 0;
const nextId = () => `m-${Date.now()}-${msgCounter++}`;

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Render very light markdown: **bold** only, keeps output safe & simple.
function renderRich(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const GREETING =
  "Hi, I'm the Spendly Assistant. Ask me about cards, limits, transactions, billing, or security — or tap a suggestion below.";

/* ---------------------------------------------------------------------------
   5. UI SUBCOMPONENTS
--------------------------------------------------------------------------- */
function ChipIcon({ size = 16, color = THEME.brass }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.6" />
      <rect x="5.5" y="8" width="6" height="4.4" rx="1" fill={color} opacity="0.85" />
      <line x1="14" y1="8" x2="19" y2="8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="14" y1="11" x2="19" y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5.5" y1="15.5" x2="12" y2="15.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={styles.typingBubble}>
      <span style={{ ...styles.dot, animationDelay: "0ms" }} />
      <span style={{ ...styles.dot, animationDelay: "150ms" }} />
      <span style={{ ...styles.dot, animationDelay: "300ms" }} />
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ ...styles.row, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <div style={styles.avatar}>
          <ChipIcon size={15} color={THEME.card} />
        </div>
      )}
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <div
          style={{
            ...styles.bubble,
            ...(isUser ? styles.bubbleUser : styles.bubbleBot),
            ...(msg.fallback ? styles.bubbleFallback : {}),
          }}
        >
          {renderRich(msg.text)}
        </div>
        <span style={styles.timestamp}>{formatTime(msg.at)}</span>
      </div>
    </div>
  );
}

function QuickReplies({ items, onPick, disabled }) {
  if (!items.length) return null;
  return (
    <div style={styles.chipRow}>
      {items.map((item) => (
        <button
          key={item.id}
          disabled={disabled}
          onClick={() => onPick(item)}
          style={{ ...styles.chip, opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer" }}
          onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = THEME.brassSoft)}
          onMouseLeave={(e) => !disabled && (e.currentTarget.style.background = THEME.paper)}
        >
          {item.question}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   6. MAIN WIDGET
--------------------------------------------------------------------------- */
export default function SpendlyChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [messages, setMessages] = useState([{ id: nextId(), role: "bot", text: GREETING, at: new Date() }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [teaserDismissed, setTeaserDismissed] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Proactive teaser bubble: pops up near the launcher a few seconds after
  // load, once, if the visitor hasn't opened the chat or dismissed it.
  useEffect(() => {
    if (hasOpenedOnce || teaserDismissed) return;
    const showAt = setTimeout(() => setShowTeaser(true), 3200);
    return () => clearTimeout(showAt);
  }, [hasOpenedOnce, teaserDismissed]);

  useEffect(() => {
    if (isOpen) setShowTeaser(false);
  }, [isOpen]);

  const quickReplies = useMemo(() => KB.filter((k) => QUICK_REPLY_IDS.includes(k.id)), []);
  const showQuickReplies = messages.length <= 1;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setHasOpenedOnce(true);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const pushMessage = useCallback((role, text, extra = {}) => {
    setMessages((prev) => [...prev, { id: nextId(), role, text, at: new Date(), ...extra }]);
  }, []);

  const respondTo = useCallback(
    (queryText) => {
      setIsTyping(true);
      const delay = 500 + Math.min(queryText.length * 12, 700);
      setTimeout(() => {
        const match = findBestAnswer(queryText);
        if (match) {
          pushMessage("bot", match.entry.answer);
        } else {
          pushMessage("bot", SUPPORT_FALLBACK, { fallback: true });
        }
        setIsTyping(false);
      }, delay);
    },
    [pushMessage]
  );

  const handleSend = useCallback(
    (rawText) => {
      const text = (rawText ?? input).trim();
      if (!text || isTyping) return;
      pushMessage("user", text);
      setInput("");
      respondTo(text);
    },
    [input, isTyping, pushMessage, respondTo]
  );

  const handleQuickReply = useCallback(
    (entry) => {
      if (isTyping) return;
      pushMessage("user", entry.question);
      setIsTyping(true);
      const delay = 450;
      setTimeout(() => {
        pushMessage("bot", entry.answer);
        setIsTyping(false);
      }, delay);
    },
    [isTyping, pushMessage]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        @keyframes spendly-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes spendly-pop {
          from { opacity: 0; transform: translateY(14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spendly-ring {
          0% { box-shadow: 0 0 0 0 rgba(201,162,39,0.45); }
          100% { box-shadow: 0 0 0 14px rgba(201,162,39,0); }
        }
        .spendly-scroll::-webkit-scrollbar { width: 6px; }
        .spendly-scroll::-webkit-scrollbar-thumb { background: #D8DAE2; border-radius: 4px; }
        .spendly-chip-row::-webkit-scrollbar { height: 0px; }

        @media (max-width: 480px) {
          .spendly-panel {
            width: 94vw !important;
            height: 78vh !important;
            right: 3vw !important;
            bottom: 84px !important;
          }
        }
      `}</style>

      {isOpen && (
        <div className="spendly-panel" style={styles.panel} role="dialog" aria-label="Spendly Assistant chat">
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerStripe} />
            <div style={styles.headerContent}>
              <div style={styles.headerAvatar}>
                <ChipIcon size={18} color={THEME.brass} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.headerTitle}>Spendly Assistant</div>
                <div style={styles.headerSubtitle}>
                  <span style={styles.onlineDot} /> Business card support
                </div>
              </div>
              <button
                aria-label="Close chat"
                onClick={() => setIsOpen(false)}
                style={styles.closeBtn}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={18} color={THEME.card} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="spendly-scroll" style={styles.messages}>
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            {isTyping && (
              <div style={styles.row}>
                <div style={styles.avatar}>
                  <ChipIcon size={15} color={THEME.card} />
                </div>
                <TypingDots />
              </div>
            )}
            {showQuickReplies && !isTyping && (
              <div style={{ marginTop: 4 }}>
                <div style={styles.suggestLabel}>Common questions</div>
                <QuickReplies items={quickReplies} onPick={handleQuickReply} disabled={isTyping} />
              </div>
            )}
          </div>

          {/* Input */}
          <div style={styles.inputBar}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about cards, limits, billing…"
              style={styles.input}
              disabled={isTyping}
            />
            <button
              aria-label="Send message"
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || isTyping ? 0.45 : 1,
                cursor: !input.trim() || isTyping ? "default" : "pointer",
              }}
            >
              <Send size={16} color={THEME.card} />
            </button>
          </div>
          <div style={styles.footerNote}>
            <ShieldCheck size={12} color={THEME.textMuted} />
            <span>Never share your password or full card number here.</span>
          </div>
        </div>
      )}

      {/* Proactive teaser popup */}
      {showTeaser && !isOpen && (
        <div style={styles.teaser} role="status">
          <button
            aria-label="Dismiss"
            onClick={() => {
              setShowTeaser(false);
              setTeaserDismissed(true);
            }}
            style={styles.teaserClose}
          >
            <X size={12} color={THEME.textMuted} />
          </button>
          <div
            style={styles.teaserBody}
            onClick={() => {
              setIsOpen(true);
              setShowTeaser(false);
            }}
          >
            <div style={styles.teaserAvatar}>
              <ChipIcon size={14} color={THEME.card} />
            </div>
            <div>
              <div style={styles.teaserTitle}>Spendly Assistant</div>
              <div style={styles.teaserText}>Need help with a card, limit, or charge? Ask me anything 👋</div>
            </div>
          </div>
          <div style={styles.teaserTail} />
        </div>
      )}

      {/* Floating launcher */}
      <button
        aria-label={isOpen ? "Close Spendly Assistant" : "Open Spendly Assistant"}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          ...styles.launcher,
          ...(!hasOpenedOnce ? styles.launcherPulse : {}),
        }}
      >
        {isOpen ? <X size={24} color={THEME.card} /> : <MessageCircle size={24} color={THEME.card} />}
        {showTeaser && !isOpen && <span style={styles.launcherBadge} />}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   7. STYLES
--------------------------------------------------------------------------- */
const styles = {
  launcher: {
    position: "fixed",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: `linear-gradient(145deg, ${THEME.navy}, ${THEME.navyDeep})`,
    border: `2px solid ${THEME.brass}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 30px rgba(23,28,42,0.35)",
    cursor: "pointer",
    zIndex: 2147483000,
  },
  launcherPulse: {
    animation: "spendly-ring 1.8s ease-out 2",
  },
  launcherBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: THEME.danger,
    border: `2px solid ${THEME.paper}`,
  },
  teaser: {
    position: "fixed",
    bottom: 98,
    right: 22,
    width: 250,
    background: THEME.card,
    borderRadius: 14,
    boxShadow: "0 14px 34px rgba(17,20,30,0.22)",
    border: `1px solid ${THEME.line}`,
    padding: "10px 12px",
    zIndex: 2147482999,
    animation: "spendly-pop 0.25s ease-out",
    fontFamily: THEME.fontBody,
  },
  teaserBody: {
    display: "flex",
    alignItems: "flex-start",
    gap: 9,
    cursor: "pointer",
    paddingRight: 14,
  },
  teaserAvatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    background: THEME.navy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  teaserTitle: {
    fontFamily: THEME.fontDisplay,
    fontWeight: 600,
    fontSize: 12.5,
    color: THEME.ink,
    marginBottom: 2,
  },
  teaserText: {
    fontSize: 12,
    lineHeight: 1.4,
    color: THEME.textMuted,
  },
  teaserClose: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  teaserTail: {
    position: "absolute",
    bottom: -6,
    right: 26,
    width: 12,
    height: 12,
    background: THEME.card,
    borderRight: `1px solid ${THEME.line}`,
    borderBottom: `1px solid ${THEME.line}`,
    transform: "rotate(45deg)",
  },
  panel: {
    position: "fixed",
    bottom: 96,
    right: 24,
    width: 380,
    height: 600,
    maxHeight: "80vh",
    background: THEME.paper,
    borderRadius: 18,
    boxShadow: "0 24px 60px rgba(17,20,30,0.28)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: THEME.fontBody,
    zIndex: 2147483000,
    animation: "spendly-pop 0.22s ease-out",
    border: `1px solid ${THEME.line}`,
  },
  header: {
    position: "relative",
    background: `linear-gradient(120deg, ${THEME.navyDeep} 0%, ${THEME.navy} 60%, ${THEME.navyDeep} 100%)`,
    padding: "16px 14px",
    overflow: "hidden",
  },
  headerStripe: {
    position: "absolute",
    top: 0,
    right: -40,
    width: 160,
    height: "220%",
    background: `linear-gradient(100deg, transparent 40%, rgba(201,162,39,0.16) 50%, transparent 60%)`,
    transform: "rotate(8deg)",
    pointerEvents: "none",
  },
  headerContent: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 9,
    background: "rgba(255,255,255,0.08)",
    border: `1px solid rgba(201,162,39,0.5)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: THEME.fontDisplay,
    fontWeight: 600,
    fontSize: 15.5,
    color: THEME.card,
    letterSpacing: "0.01em",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: THEME.mint,
    display: "inline-block",
    boxShadow: `0 0 0 3px rgba(47,168,138,0.2)`,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    borderRadius: 8,
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: THEME.paper,
  },
  row: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 8,
    background: THEME.navy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    padding: "10px 13px",
    borderRadius: 14,
    fontSize: 13.5,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  bubbleBot: {
    background: THEME.card,
    color: THEME.ink,
    border: `1px solid ${THEME.line}`,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    background: THEME.navy,
    color: THEME.card,
    borderBottomRightRadius: 4,
  },
  bubbleFallback: {
    background: "#FBF3ED",
    border: `1px solid ${THEME.danger}33`,
  },
  timestamp: {
    fontFamily: THEME.fontMono,
    fontSize: 10,
    color: THEME.textMuted,
    marginTop: 4,
    padding: "0 4px",
  },
  typingBubble: {
    background: THEME.card,
    border: `1px solid ${THEME.line}`,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    padding: "12px 14px",
    display: "flex",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: THEME.textMuted,
    display: "inline-block",
    animation: "spendly-bounce 1.2s infinite ease-in-out",
  },
  suggestLabel: {
    fontFamily: THEME.fontMono,
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: THEME.textMuted,
    margin: "4px 0 8px 2px",
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    background: THEME.paper,
    border: `1px solid ${THEME.line}`,
    borderRadius: 999,
    padding: "7px 12px",
    fontSize: 12.5,
    color: THEME.ink,
    fontFamily: THEME.fontBody,
    transition: "background 0.15s ease",
  },
  inputBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    background: THEME.card,
    borderTop: `1px solid ${THEME.line}`,
  },
  input: {
    flex: 1,
    border: `1px solid ${THEME.line}`,
    borderRadius: 999,
    padding: "10px 14px",
    fontSize: 13.5,
    fontFamily: THEME.fontBody,
    outline: "none",
    color: THEME.ink,
    background: THEME.paper,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: THEME.navy,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  footerNote: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    padding: "0 14px 10px",
    background: THEME.card,
    fontSize: 10.5,
    color: THEME.textMuted,
  },
};
