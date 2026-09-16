from pathlib import Path

index = Path("index.html")
text = index.read_text(encoding="utf-8")

css_anchor = '''      .machine-flow {
        display: grid;
'''
css = '''      .gate-milestone {
        margin: 0 auto 48px;
        padding: 28px;
        border: 1px solid rgba(112, 201, 193, 0.24);
        background: linear-gradient(135deg, rgba(13, 28, 25, 0.9), rgba(9, 20, 17, 0.96));
      }
      .gate-milestone-head {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
        gap: 34px;
        align-items: end;
      }
      .gate-milestone h2 {
        margin: 10px 0 12px;
        font: 400 clamp(30px, 4vw, 48px)/1 var(--serif);
      }
      .gate-milestone p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.75;
      }
      .gate-stats {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 1px;
        margin-top: 24px;
        border: 1px solid var(--line);
        background: var(--line);
      }
      .gate-stats div {
        padding: 18px 14px;
        background: #091411;
      }
      .gate-stats strong,
      .gate-stats span {
        display: block;
      }
      .gate-stats strong {
        color: var(--gold-2);
        font: 400 27px/1 var(--serif);
      }
      .gate-stats span {
        margin-top: 8px;
        color: var(--muted);
        font: 9px/1.45 var(--mono);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .gate-programs {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        color: var(--gold-2);
        font: 400 14px/1.7 var(--serif);
      }
      .gate-actions {
        display: flex;
        gap: 10px;
        margin-top: 18px;
        flex-wrap: wrap;
      }
      .machine-flow {
        display: grid;
'''
if ".gate-milestone {" not in text:
    if css_anchor not in text:
        raise SystemExit("CSS anchor not found")
    text = text.replace(css_anchor, css, 1)

html_anchor = '''      <figure class="image-band">
'''
html = '''      <section class="shell gate-milestone" aria-labelledby="gate-milestone-title">
        <div class="gate-milestone-head">
          <div>
            <div class="eyebrow">Gate evidence milestone</div>
            <h2 id="gate-milestone-title">231 Gates. Evidence before execution.</h2>
            <p>
              Quantum Etz Chaim keeps every directional Gate fail-closed until a
              replayable IvritCode run supplies the program, deterministic seed,
              exact Gate index, and observed machine topology needed to approve it.
              Symbolism alone never activates a Gate.
            </p>
          </div>
          <div>
            <p>
              The current milestone spans eight compiler-verified evidence programs.
              Repeated-letter reinforcement remains a self-transition outside the
              canonical 231-Gate registry.
            </p>
            <div class="gate-actions">
              <a class="button" href="qec-v0.1.html">Explore Gate rules <span>→</span></a>
              <a class="button" href="console.html">Open the runtime <span>→</span></a>
            </div>
          </div>
        </div>
        <div class="gate-stats" aria-label="Gate evidence counts">
          <div><strong>231</strong><span>Canonical Gates</span></div>
          <div><strong>462</strong><span>Directional possibilities</span></div>
          <div><strong>22</strong><span>Evidence-backed directions</span></div>
          <div><strong>440</strong><span>Reserved directions</span></div>
          <div><strong>8</strong><span>Evidence programs</span></div>
        </div>
        <div class="gate-programs" lang="he" dir="rtl">
          אור · שלום · בראשית · אמת · אחד · חיים · דעת · מלכות
        </div>
      </section>

      <figure class="image-band">
'''
if 'id="gate-milestone-title"' not in text:
    if html_anchor not in text:
        raise SystemExit("HTML anchor not found")
    text = text.replace(html_anchor, html, 1)

if ".gate-milestone-head {\n          grid-template-columns: 1fr;" not in text:
    text = text.replace(
        '''        .release-status {
          grid-template-columns: 1fr 1fr;
        }
''',
        '''        .release-status {
          grid-template-columns: 1fr 1fr;
        }
        .gate-milestone-head {
          grid-template-columns: 1fr;
        }
        .gate-stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
''',
        1,
    )
if ".gate-milestone {\n          padding: 22px;" not in text:
    text = text.replace(
        '''        .release-status {
          grid-template-columns: 1fr;
        }
''',
        '''        .release-status {
          grid-template-columns: 1fr;
        }
        .gate-milestone {
          padding: 22px;
        }
        .gate-stats {
          grid-template-columns: 1fr 1fr;
        }
''',
        1,
    )
index.write_text(text, encoding="utf-8")

test_path = Path("tests/landing-interaction.test.ts")
tests = test_path.read_text(encoding="utf-8")
anchor = '''  it("provides complete mobile navigation instead of hiding site routes", () => {
'''
block = '''  it("surfaces the evidence-backed Gate milestone", () => {
    expect(landingPage).toContain('id="gate-milestone-title"');
    expect(landingPage).toContain("231 Gates. Evidence before execution.");
    expect(landingPage).toContain("<strong>22</strong><span>Evidence-backed directions</span>");
    expect(landingPage).toContain("<strong>440</strong><span>Reserved directions</span>");
    expect(landingPage).toContain("<strong>8</strong><span>Evidence programs</span>");
    expect(landingPage).toContain("אור · שלום · בראשית · אמת · אחד · חיים · דעת · מלכות");
  });

'''
if 'surfaces the evidence-backed Gate milestone' not in tests:
    if anchor not in tests:
        raise SystemExit("Test anchor not found")
    tests = tests.replace(anchor, block + anchor, 1)
test_path.write_text(tests, encoding="utf-8")
