import type { SeedQuest } from '../quest-types'
import { natureScienceMovementQuests } from './nature-science-movement'
import { makingQuests } from './making'
import { peopleQuests } from './people'

export const seedQuests: SeedQuest[] = [
  ...natureScienceMovementQuests,
  ...makingQuests,
  ...peopleQuests,
]
