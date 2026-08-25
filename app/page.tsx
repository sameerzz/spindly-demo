import SpendlyChatbot from "../SpendlyChatbot";
const transactions = [
  { icon: "N", merchant: "Notion", category: "Software", amount: "$18.00", tone: "lilac" },
  { icon: "F", merchant: "Figma", category: "Design", amount: "$24.00", tone: "coral" },
  { icon: "A", merchant: "AWS", category: "Infrastructure", amount: "$142.80", tone: "amber" },
];

const features = [
  { number: "01", title: "Issue cards in seconds", copy: "Give every employee a card that’s ready to use, with the right budget already built in." },
  { number: "02", title: "Control every dollar", copy: "Set smart limits by person, team, merchant, or category. Change them whenever plans change." },
  { number: "03", title: "Close books without the chase", copy: "Receipts, notes, and accounting data stay attached to each transaction automatically." },
];

export default function Home() {
  return (
    <main>
      <section className="hero" id="home">
        <nav className="nav shell" aria-label="Primary navigation">
          <a className="brand" href="#home" aria-label="Spendly home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>spendly</span></a>
          <div className="nav-links"><a href="#product">Product</a><a href="#controls">Solutions</a><a href="#security">Security</a><a href="#pricing">Pricing</a></div>
          <div className="nav-actions"><a className="login" href="#login">Log in</a><a className="button button-small button-light" href="#get-started">Get started <span>↗</span></a></div>
        </nav>

        <div className="hero-content shell">
          <div className="eyebrow"><span /> Company spending, simplified</div>
          <h1>Spend smart.<br /><em>Move fast.</em></h1>
          <p className="hero-copy">Cards, expenses, and approvals in one remarkably simple place. Built for ambitious teams that refuse to slow down.</p>
          <div className="hero-actions"><a className="button button-gold" href="#get-started">Start spending smarter <span>↗</span></a><a className="text-link" href="#product"><span className="play">▶</span> See how it works</a></div>
          <div className="proof"><div className="avatars" aria-hidden="true"><span>SK</span><span>MO</span><span>JD</span><span>AN</span></div><div><strong>4.9 out of 5</strong><small>Trusted by 2,000+ finance teams</small></div></div>
        </div>

        <div className="hero-visual" aria-label="Spendly product preview">
          <div className="glow glow-one" /><div className="glow glow-two" />
          <div className="app-window">
            <aside className="sidebar"><div className="mini-brand"><span className="brand-mark"><i /><i /><i /></span></div><span className="side-dot active" /><span className="side-dot" /><span className="side-dot" /><span className="side-dot" /><span className="side-avatar">AM</span></aside>
            <div className="dashboard">
              <div className="dash-head"><div><small>MONDAY, 24 JUNE</small><h3>Good morning, Alex</h3></div><button aria-label="Notifications">•</button></div>
              <div className="stat-grid"><div className="stat-card dark"><small>Available balance</small><strong>$48,280.42</strong><span>↑ 8.4% from last month</span></div><div className="stat-card"><small>Spent this month</small><strong>$12,648.18</strong><div className="progress"><i /></div><span>$7,351.82 remaining</span></div></div>
              <div className="dash-section-title"><strong>Recent transactions</strong><span>View all →</span></div>
              <div className="transactions">{transactions.map((item) => <div className="transaction" key={item.merchant}><b className={item.tone}>{item.icon}</b><div><strong>{item.merchant}</strong><small>{item.category} · Today</small></div><span>{item.amount}</span></div>)}</div>
            </div>
          </div>
          <div className="spend-card"><div className="card-top"><span>spendly</span><b>VISA</b></div><div className="chip"><i /><i /><i /></div><div className="card-number">•••• &nbsp; 4829</div><div className="card-bottom"><span>ALEX MORGAN</span><span>08/29</span></div></div>
          <div className="approval-toast"><span>✓</span><div><strong>Payment approved</strong><small>$24.00 at Figma</small></div></div>
        </div>
        <div className="trusted shell"><span>POWERING MODERN FINANCE TEAMS AT</span><div><b>northstar</b><b>STUDIOHAUS</b><b>VERTEX</b><b>monogram</b><b>KINETIC</b></div></div>
      </section>

      <section className="features shell" id="product">
        <div className="section-intro"><div><span className="kicker">Everything you need</span><h2>More control.<br />Less <em>busywork.</em></h2></div><p>From the first swipe to the final reconciliation, Spendly keeps every purchase visible, compliant, and effortless.</p></div>
        <div className="feature-grid">{features.map((feature) => <article key={feature.number}><span className="feature-number">{feature.number}</span><div className={`feature-art art-${feature.number}`} aria-hidden="true">{feature.number === "01" && <><div className="mini-card back" /><div className="mini-card front"><span>spendly</span><b>•••• 7842</b></div><span className="plus">+</span></>}{feature.number === "02" && <><div className="limit-row"><span>Monthly limit</span><b>$4,000</b></div><div className="limit-bar"><i /></div><div className="limit-meta"><span>Spent $1,840</span><span>46%</span></div></>}{feature.number === "03" && <><div className="receipt"><b>Receipt matched</b><span>Figma · $24.00</span><i>✓</i></div><div className="receipt-line" /><div className="receipt-line short" /></>}</div><h3>{feature.title}</h3><p>{feature.copy}</p><a href="#get-started" aria-label={`Learn more about ${feature.title}`}>Learn more <span>→</span></a></article>)}</div>
      </section>

      <section className="control-section" id="controls"><div className="shell control-grid"><div><span className="kicker kicker-light">Built for real teams</span><h2>Guardrails that<br />don’t feel like<br /><em>roadblocks.</em></h2><p>Give your team the freedom to move quickly—with policies that work quietly in the background.</p><a className="button button-light" href="#get-started">Explore spend controls <span>↗</span></a></div><div className="policy-panel"><div className="policy-head"><div><small>SPENDING POLICY</small><h3>Marketing team</h3></div><span className="live">● Active</span></div><div className="policy-item"><span className="policy-icon">$</span><div><small>MONTHLY LIMIT</small><strong>$25,000</strong></div><b>›</b></div><div className="policy-item"><span className="policy-icon">⌁</span><div><small>ALLOWED CATEGORIES</small><strong>Software, Ads, Travel +2</strong></div><b>›</b></div><div className="policy-item"><span className="policy-icon">✓</span><div><small>APPROVAL REQUIRED</small><strong>Above $1,000</strong></div><b>›</b></div></div></div></section>

      <section className="security shell" id="security"><div><span className="kicker">Serious about security</span><h2>Your money stays<br />in <em>safe hands.</em></h2></div><div className="security-points"><p><b>Bank-grade protection</b><span>Industry-leading encryption and continuous monitoring protect every transaction.</span></p><p><b>You’re always in control</b><span>Freeze cards instantly, adjust limits, and see activity the moment it happens.</span></p></div></section>

      <section className="cta" id="get-started"><div className="shell"><span className="kicker kicker-light">Ready when you are</span><h2>Make every dollar<br />work <em>harder.</em></h2><p>Join 2,000+ teams making smarter spending decisions with Spendly.</p><a className="button button-gold" href="mailto:hello@spendly.example">Get started for free <span>↗</span></a><small>No credit card required · Set up in minutes</small></div></section>
      <footer className="footer shell" id="pricing"><a className="brand" href="#home"><span className="brand-mark"><i /><i /><i /></span><span>spendly</span></a><p>Smarter company spending,<br />from swipe to close.</p><div><a href="#product">Product</a><a href="#security">Security</a><a href="#get-started">Contact</a></div><small>© 2026 Spendly. All rights reserved.</small></footer>
      <SpendlyChatbot />
    </main>
  );
}
