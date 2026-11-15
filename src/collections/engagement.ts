import type { CollectionConfig } from 'payload'
import { ContactMessages } from './ContactMessages'
import { Subscribers } from './Subscribers'
import { PostReactions } from './PostReactions'
import { PostViews } from './PostViews'
import { PageVisits } from './PageVisits'
import { AnalyticsEvents } from './AnalyticsEvents'

export const engagementCollections: CollectionConfig[] = [ContactMessages, Subscribers, PostReactions, PostViews, PageVisits, AnalyticsEvents]
