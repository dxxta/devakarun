import type { CollectionConfig } from 'payload'
import { Categories } from './Categories'
import { Commenters } from './Commenters'
import { Comments } from './Comments'
import { Posts } from './Posts'
import { Tags } from './Tags'

export const blogCollections: CollectionConfig[] = [Categories, Tags, Posts, Commenters, Comments]
