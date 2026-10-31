// Framer Motion's animation engine, loaded as its own chunk by
// <MotionProvider> after the page renders. domMax (not the smaller
// domAnimation) because some components use `layout` animations.
import { domMax } from "framer-motion";

export default domMax;
