import type { Service } from '../types/services'

// Replace this local array with a Supabase `services` query later. The page
// already sorts by `order`, matching a future database ordering column.
export const services: Service[] = [
  {
    id: 'bridal-makeup',
    title: 'Bridal Makeup',
    description: 'A considered bridal look designed around your features, personal style and the atmosphere of your wedding day.',
    price: 'Price upon request',
    order: 1,
  },
  {
    id: 'event-makeup',
    title: 'Event Makeup',
    description: 'Polished makeup for celebrations, formal occasions and evenings when you want to feel like the best version of yourself.',
    price: 'Price upon request',
    order: 2,
  },
  {
    id: 'photoshoots',
    title: 'Photoshoots',
    description: 'Camera-ready beauty for campaigns, portraits, fashion stories and creative productions, developed in collaboration with your team.',
    price: 'Price upon request',
    order: 3,
  },
  {
    id: 'editorial-creative',
    title: 'Editorial & Creative',
    description: 'Concept-led makeup for publications, branded content and creative projects that call for a distinctive visual direction.',
    price: 'Price upon request',
    order: 4,
  },
  {
    id: 'makeup-lesson',
    title: 'Personal Makeup Lesson',
    description: 'A relaxed, individual session focused on techniques, product choices and a routine that works for your everyday life.',
    price: 'Price upon request',
    order: 5,
  },
]
