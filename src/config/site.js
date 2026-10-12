// ===========================================================================
//  SITE CONFIGURATION
//  Everything that controls the *shape* of the site lives here.
//  Content lives in src/data/. Presentation lives in src/components/.
// ===========================================================================

export const site = {
  url: 'https://mdhumayun7.github.io/MD-HUMAYUN-PORTFOLIO/',
  title: 'MD Humayun — ML Engineer & Software Development Engineer',

  // -------------------------------------------------------------------
  // SECTIONS
  // The order of this array is the order of the page AND the nav menu.
  // Drag a line up or down to reorder the site. Set enabled:false to hide
  // a section completely -- it disappears from the page and the nav together.
  // `nav` is the label shown in the header; omit it to keep a section on the
  // page but out of the menu (that is what Hero does).
  // -------------------------------------------------------------------
  sections: [
    { id: 'hero', enabled: true },
    { id: 'about', enabled: true, nav: 'About' },
    { id: 'projects', enabled: true, nav: 'Work' },
    { id: 'skills', enabled: true, nav: 'Skills' },
    { id: 'notes', enabled: true, nav: 'Notes' },
    { id: 'experience', enabled: true, nav: 'Experience' },
    { id: 'publications', enabled: true, nav: 'Research' },
    { id: 'achievements', enabled: true, nav: 'Awards' },
    { id: 'contact', enabled: true, nav: 'Contact' },
  ],

  // -------------------------------------------------------------------
  // FEATURE FLAGS
  // -------------------------------------------------------------------
  features: {
    figureRail: true,      // the left-margin figure tracker (signature element)
    simulations: true,     // set false to show diagrams only, no interactive demos
    filterBar: true,       // the discipline/tech filter above the project list
    themeToggle: true,
    roleLens: true,        // the 'I am hiring for' selector in the hero
    commandPalette: true,  // Ctrl+K / '/' jump menu
    guide: true,           // the scripted guide bot (cursor trail, tour, Q&A)
    stickyActions: true,   // Resume / Email bar that follows the visitor
  },

  // -------------------------------------------------------------------
  // CONTACT FORM
  // The form works out of the box using the visitor's email client.
  // To collect submissions in your inbox instead:
  //   1. create a free form at https://formspree.io
  //   2. paste the form ID (looks like 'xayzbwqd') below
  // Leave it null and the mailto fallback stays active.
  // -------------------------------------------------------------------
  contactForm: {
    provider: 'formspree',
    formId: null, // [FILL IN: Formspree form ID]
  },

  // -------------------------------------------------------------------
  // ANALYTICS (optional, privacy-friendly, no cookies)
  // Create a free site at https://www.goatcounter.com, then put its code here.
  // For https://mysite.goatcounter.com the code is 'mysite'. Leave null to keep
  // analytics completely off.
  // -------------------------------------------------------------------
  analytics: {
    goatcounter: null, // [FILL IN: GoatCounter site code]
  },

  // -------------------------------------------------------------------
  // THEME
  // These values MIRROR the CSS variables in src/index.css -- they are here
  // so you can see the whole palette in one place. To actually change a
  // colour you must edit src/index.css (that is what the browser reads).
  // -------------------------------------------------------------------
  theme: {
    defaultMode: 'system', // 'system' | 'light' | 'dark'
    light: {
      bg: '#F4F4F1',
      surface: '#EAEAE6',
      fg: '#15171A',
      accent: '#0E5A5B',
      grey500: '#63666B',
      grey200: '#DEDEDA',
    },
    dark: {
      bg: '#0F1113',
      surface: '#171A1D',
      fg: '#E7E9EA',
      accent: '#45B3AA',
      grey500: '#8A8F94',
      grey200: '#23272B',
    },
  },

  // -------------------------------------------------------------------
  // TYPE
  // Changing these requires also updating the <link> tag in index.html
  // and the fontFamily block in tailwind.config.js. See CONTENT_GUIDE.md.
  // -------------------------------------------------------------------
  fonts: {
    display: 'Fraunces',
    body: 'Inter',
    scale: 1.25,
  },
}

/** Sections that are switched on, in page order. Used by App and Header. */
export const enabledSections = site.sections.filter((s) => s.enabled)
