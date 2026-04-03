// Design System: Animation Tokens (Framer Motion)

export const transitions = {
  spring: { type: 'spring' as const, stiffness: 500, damping: 30 },
  smooth: { type: 'tween' as const, duration: 0.2, ease: 'easeInOut' as const },
  slow: { type: 'tween' as const, duration: 0.3, ease: 'easeOut' as const },
}

export const variants = {
  // List item appear/disappear
  listItem: {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -16, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 },
  },

  // Collapse/expand (subtasks, forms)
  collapse: {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' as const },
    visible: { opacity: 1, height: 'auto', overflow: 'visible' as const },
  },

  // View transitions (tab switching)
  viewTransition: {
    enter: { opacity: 0, y: 8 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },

  // Modal
  modal: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },

  // Fade in
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },

  // Stagger children
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  },
}
