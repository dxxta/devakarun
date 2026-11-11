import type { CollectionConfig, GlobalConfig } from 'payload'

import { Certificates } from './Certificates'
import { Projects } from './Projects'
import { TechStack } from './TechStack'
import { PortfolioShowcases } from './PortfolioShowcases'
import { Profile } from '../globals/Profile'
import { SiteSettings } from '../globals/SiteSettings'

export const portfolioCollections: CollectionConfig[] = [TechStack, Certificates, Projects, PortfolioShowcases]
export const portfolioGlobals: GlobalConfig[] = [SiteSettings, Profile]
