import type { AboutPageContent, HomepageContent } from '../types/siteContent'

export const defaultHomepageContent: HomepageContent = {
  heading: 'Elma Rún',
  subtitle: 'Makeup Artist · Reykjavík',
  introductionHeading: 'Beauty that feels like you, only elevated.',
  introductionText: 'Elma Rún creates polished, modern makeup with a quiet confidence—enhancing natural features while keeping every look personal. Based in Iceland and available for weddings, special events, studio work and editorial collaborations.',
  heroImage: null,
  featuredPortfolioIds: [],
  primaryButton: { label: 'View selected work', href: '#featured' },
  bookingHeading: 'Let’s create something beautiful.',
  bookingButton: { label: 'Start a booking inquiry', href: '/contact' },
}

export const defaultAboutPageContent: AboutPageContent = {
  eyebrow: 'About Elma Rún',
  heading: 'Meet the Artist',
  introduction: 'I am a professional makeup artist based in Iceland, creating refined, personal beauty looks for weddings, events, studio work and editorial projects.',
  portraitImage: null,
  biographyHeading: 'Background & experience',
  biographyHtml: '<p>Your professional story will appear here—your training, the path that led you to makeup artistry, and the clients and creative teams you have worked with.</p><p>This space is reserved for career highlights, publications, collaborations, and the experience you would like prospective clients to understand before booking.</p>',
  approachHeading: 'My approach',
  approachText: 'My approach begins with listening. Every look is shaped around the person, the setting and how they want to feel, with careful preparation and a finish that remains recognisably their own.',
  sections: [],
}
