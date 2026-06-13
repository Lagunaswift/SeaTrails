# Domain authentication: SPF, DKIM, DMARC

The non-negotiable foundation of deliverability. These three DNS-based mechanisms prove that mail claiming to come from your domain genuinely does. Without them, modern mail providers treat your mail as untrustworthy, junk it, or reject it outright, and as of recent rules, Gmail and Yahoo *require* them for bulk senders. This is the first thing to check and the first thing to fix; nothing else matters if mail is rejected for failing authentication.

## SPF (Sender Policy Framework)

SPF is a DNS record (a TXT record on your domain) that lists which servers/services are authorised to send email on behalf of your domain. When a receiving server gets mail claiming to be from you, it checks whether the sending server is in your SPF list. If not, the mail is suspect.
- Set it to include your sending provider (the provider gives you the value to add).
- A common failure is multiple services sending for the domain but SPF only listing one, or no SPF record at all.
- SPF has limits (a cap on DNS lookups) that complex setups can exceed; keep it clean.

## DKIM (DomainKeys Identified Mail)

DKIM adds a cryptographic signature to every outgoing message, signed with a private key held by your sending provider, verifiable with a public key published in your DNS. The receiver checks the signature: if it validates, the mail genuinely came from your domain and was not tampered with in transit. Set up by adding the DKIM DNS records your provider gives you (usually a couple of CNAME or TXT records). DKIM is what lets a receiver trust the mail is authentically yours.

## DMARC (Domain-based Message Authentication, Reporting and Conformance)

DMARC ties SPF and DKIM together and tells receivers what to do with mail that fails them. A DMARC DNS record states a policy:
- `p=none`, monitor only (collect reports, take no action), the place to start.
- `p=quarantine`, send failing mail to spam.
- `p=reject`, refuse failing mail entirely, the strongest, the goal once you are confident your legitimate mail passes.

DMARC also requests **reports**, receivers send you data on what mail is passing/failing authentication for your domain, which reveals both misconfiguration and anyone spoofing you. It also enforces "alignment", that the domain in the visible From address matches the authenticated domain, closing a spoofing gap SPF/DKIM alone leave.

The sensible path: publish DMARC at `p=none`, read the reports, fix anything legitimate that is failing, then tighten to `quarantine` and eventually `reject`.

## How they work together
SPF says "these servers may send for me." DKIM says "this message is cryptographically proven to be from me and unaltered." DMARC says "require one of those to pass *and* align with the visible sender, and here is what to do if it fails, and send me reports." Together they make your domain trustworthy to receivers and hard to spoof. Gmail/Yahoo bulk-sender rules now effectively mandate all three.

## What to flag
- No SPF, no DKIM, or no DMARC, any missing one is a top-priority finding; mail will be junked or rejected.
- SPF that does not include the actual sending provider.
- DMARC absent (increasingly required) or never moved past monitoring.
- Sending from a domain you do not control the DNS for (you cannot authenticate it).

## The honest framing
This is the floor. An app sending even a single password-reset email needs SPF, DKIM, and DMARC on its sending domain, or that email may silently never arrive. It is a one-time DNS setup (your provider supplies the exact records), and it is the highest-priority deliverability work because failing it can sink everything regardless of how good the content or list is. Set up all three, start DMARC at monitor, tighten over time.

## Connection to other skills
The DNS records and provider configuration sit in the `release-and-ops` domain (DNS, domain config, provider keys). Once authenticated, reputation (sender-reputation.md) becomes the ongoing factor.
