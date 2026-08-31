/**
 * The message a demo composes when someone taps Order or Book.
 *
 * THE DEMO'S OWN BUTTONS DO NOT OPEN A REAL CHAT.
 *
 * There is no business behind The Crust & Crumble. A wa.me link on its
 * order button would either go nowhere or, far worse, go to a real number
 * that someone owns, and these pages are built to be forwarded around
 * WhatsApp. So the demo shows the composed message in a sheet, with a
 * line explaining that on a real site this opens WhatsApp with the order
 * already typed.
 *
 * That is not a compromise. It demonstrates the mechanic better than a
 * live link would, because the prospect gets to READ the message their
 * own customers would send them, which is the thing being sold.
 *
 * The only live WhatsApp link on any demo page is the VelBiz one in
 * DemoCta, which goes through waLink() from config/site.js.
 *
 * NO PHONE NUMBERS IN ANY OF THESE STRINGS. check-brand-leak.mjs walks
 * content/ and hard-fails on a bare twelve-digit run, on +91 followed by
 * ten digits, and on any wa.me URL. It is right to.
 */

function rupees(n) {
    /* Indian digit grouping: last three, then pairs. 1234567 -> 12,34,567 */
    const s = String(Math.round(n));
    if (s.length <= 3) return s;
    const last = s.slice(-3);
    const rest = s.slice(0, -3);
    return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last}`;
}

export { rupees };

/** An itemised order, the way a customer would actually send one. */
export function orderMessage({ business, lines, area }) {
    const items = lines.map(
        (l, i) => `${i + 1}. ${l.qty} x ${l.name}  Rs ${rupees(l.price * l.qty)}`,
    );
    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

    return [
        `Hello ${business}, I would like to order:`,
        '',
        ...items,
        '',
        `Total: Rs ${rupees(total)}`,
        area ? `Deliver to: ${area}` : null,
        'Name: ',
    ]
        .filter((line) => line !== null)
        .join('\n');
}

/** A booking: a table, a room, a slot, a seat. */
export function bookingMessage({ business, what, when, party, note }) {
    return [
        `Hello ${business}, I would like to book ${what}.`,
        '',
        when ? `When: ${when}` : null,
        party ? `For: ${party}` : null,
        note ? `Note: ${note}` : null,
        'Name: ',
    ]
        .filter((line) => line !== null)
        .join('\n');
}
