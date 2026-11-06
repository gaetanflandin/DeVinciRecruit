/**
 * GET /api/associations returns sample association profiles.
 */
import { Router } from 'express'

const router = Router()

// Sample data for the lab; no database connection is needed.
// Exported so the applications route can check that an associationId exists.
export const associations = [
  {
    id: 1,
    name: 'Vinci Racing Team',
    description: 'A student team bringing together motorsport and engineering enthusiasts.',
    category: 'Engineering',
    logoUrl: 'https://example.com/logos/vinci-racing-team.png'
  },
  {
    id: 2,
    name: 'De Vinci Coding Club (sample)',
    description: 'A sample association for students interested in programming and software projects.',
    category: 'Technology',
    logoUrl: 'https://example.com/logos/coding-club.png'
  }
]

router.get('/api/associations', (_req, res) => {
  res.status(200).json(associations)
})

export default router

