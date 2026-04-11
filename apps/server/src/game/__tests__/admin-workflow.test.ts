import { describe, it } from 'vitest'

describe('Question Status Gate (Admin Workflow)', () => {
  it.todo('game:start only serves questions with status approved')
  it.todo('game:start excludes questions with status draft')
  it.todo('game:start excludes questions with status live')
  it.todo('approving a draft question makes it available for game:start')
  it.todo('questions from archived categories are not served')
})
