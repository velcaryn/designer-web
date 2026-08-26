'use client';

/**
 * The client work, deliberately last.
 *
 * On the old home page this sat fourth and carried the argument. That was
 * backwards. A visitor who runs a shop does not decide from someone else's
 * screenshots; they decide from whether the page understood their problem.
 * So the whole page above earns the attention, and this section is the
 * closing evidence that we have actually shipped what we described.
 *
 * Nothing here reads the business context: this section is about real
 * clients, and pulling the visitor's typed name anywhere near it would
 * blur the line between the demonstration above and the proof here.
 *
 * NO INVENTED METRICS, AND NOW NO STAT BOXES AT ALL
 *
 * There used to be a row of four figures under the frames (two
 * languages, one tap, Edge, 9/19). Every one of them was true and
 * checkable, but they were details about how the work was built rather
 * than reasons to care, and they competed with the screenshots that are
 * the actual evidence. The section is the frames now. There is still no
 * conversion rate, no traffic multiple and no testimonial, because we do
 * not have real ones.
 *
 * ROUND FOUR: EVERY FRAME SHUFFLES ACROSS BOTH PROJECTS
 *
 * A client component, because ClProofGallery needs an interval and an
 * IntersectionObserver to lazy-start the cycling once the section is
 * approaching the viewport. The two phone frames share the portrait pool
 * and the Safari frame takes the landscape pool, both spanning lihashop
 * and velcaryn, so which client appears in which device is different on
 * every tick. See ClProofGallery.js for the pools and why the first
 * index is seeded rather than random.
 *
 * HOVER LIFT, PURE CSS
 *
 * Each frame sits in a `.cl-proof__frameWrap` that lifts a couple of
 * pixels on hover. The cycling itself ignores hover and focus entirely.
 */
import { Safari } from '@/registry/magicui/safari';
import { Iphone } from '@/registry/magicui/iphone';
import { Android } from '@/registry/magicui/android';
import Reveal from '@/components/Reveal';
import ClProofGallery, {
    useNearViewport,
    PORTRAIT_SHOTS,
    LANDSCAPE_SHOTS,
} from './ClProofGallery';


export default function ClProof() {
    const [sectionRef, near] = useNearViewport();

    return (
        <section id="work" ref={sectionRef} className="nv-section nv-ground--warm">
            <div className="nv-shell">
                <div className="cl-head cl-head--wide">
                    <h2 className="cl-h2">
                        Some examples you may like.
                    </h2>
                    <p className="nv-lede">
                        A small business who sells authentic palm jaggery,
                        and a B2B surgical and medical supplier. Fully
                        customised for mobile view and desktop view.
                    </p>
                </div>

                {/* No per-frame caption any more. Each frame now shuffles
                    across BOTH projects, so a fixed label under it
                    ("lihashop.in, phone") went out of date the moment the
                    shot changed and was actively misleading. */}
                <div className="cl-proof__frames">
                    <Reveal delay={0.04} className="cl-proof__frameWrap">
                        <ClProofGallery
                            Frame={Iphone}
                            shots={PORTRAIT_SHOTS}
                            seed={0}
                            alt="A page from one of our client builds, on an iPhone."
                            sizes="(max-width: 899px) 60vw, 20vw"
                            active={near}
                        />
                    </Reveal>

                    <Reveal className="cl-proof__frameWrap">
                        <ClProofGallery
                            Frame={Safari}
                            frameProps={{ url: 'velcaryn.com' }}
                            shots={LANDSCAPE_SHOTS}
                            seed={1}
                            alt="A page from one of our client builds, on a laptop."
                            sizes="(max-width: 899px) 100vw, 55vw"
                            active={near}
                            ratio="1920 / 957"
                        />
                    </Reveal>

                    <Reveal delay={0.08} className="cl-proof__frameWrap">
                        <ClProofGallery
                            Frame={Android}
                            shots={PORTRAIT_SHOTS}
                            seed={2}
                            alt="A page from one of our client builds, on an Android phone."
                            sizes="(max-width: 899px) 60vw, 20vw"
                            active={near}
                        />
                    </Reveal>
                </div>

            </div>
        </section>
    );
}
