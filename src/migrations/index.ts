import * as migration_20261111_124718_initial from './20261111_124718_initial';
import * as migration_20261112_005843_highlight from './20261112_005843_highlight';
import * as migration_20261112_011916_github_language from './20261112_011916_github_language';
import * as migration_20261112_022325_project_readme_sections from './20261112_022325_project_readme_sections';
import * as migration_20261112_023016_project_preview_source from './20261112_023016_project_preview_source';
import * as migration_20261112_032259_profile_list_previews from './20261112_032259_profile_list_previews';
import * as migration_20261112_041322_portfolio_showcases from './20261112_041322_portfolio_showcases';
import * as migration_20261115_120000_site_announcement from './20261115_120000_site_announcement';
import * as migration_20261115_140000_gallery_images from './20261115_140000_gallery_images';
import * as migration_20261115_150000_post_reactions_views from './20261115_150000_post_reactions_views';
import * as migration_20261115_160000_analytics from './20261115_160000_analytics';
import * as migration_20261115_170000_profile_avatar_alt from './20261115_170000_profile_avatar_alt';
import * as migration_20261115_180000_site_features from './20261115_180000_site_features';
import * as migration_20261116_030000_posts_autosave from './20261116_030000_posts_autosave';

export const migrations = [
  {
    up: migration_20261111_124718_initial.up,
    down: migration_20261111_124718_initial.down,
    name: '20261111_124718_initial',
  },
  {
    up: migration_20261112_005843_highlight.up,
    down: migration_20261112_005843_highlight.down,
    name: '20261112_005843_highlight',
  },
  {
    up: migration_20261112_011916_github_language.up,
    down: migration_20261112_011916_github_language.down,
    name: '20261112_011916_github_language',
  },
  {
    up: migration_20261112_022325_project_readme_sections.up,
    down: migration_20261112_022325_project_readme_sections.down,
    name: '20261112_022325_project_readme_sections',
  },
  {
    up: migration_20261112_023016_project_preview_source.up,
    down: migration_20261112_023016_project_preview_source.down,
    name: '20261112_023016_project_preview_source',
  },
  {
    up: migration_20261112_032259_profile_list_previews.up,
    down: migration_20261112_032259_profile_list_previews.down,
    name: '20261112_032259_profile_list_previews',
  },
  {
    up: migration_20261112_041322_portfolio_showcases.up,
    down: migration_20261112_041322_portfolio_showcases.down,
    name: '20261112_041322_portfolio_showcases',
  },
  {
    up: migration_20261115_120000_site_announcement.up,
    down: migration_20261115_120000_site_announcement.down,
    name: '20261115_120000_site_announcement',
  },
  {
    up: migration_20261115_140000_gallery_images.up,
    down: migration_20261115_140000_gallery_images.down,
    name: '20261115_140000_gallery_images',
  },
  {
    up: migration_20261115_150000_post_reactions_views.up,
    down: migration_20261115_150000_post_reactions_views.down,
    name: '20261115_150000_post_reactions_views',
  },
  {
    up: migration_20261115_160000_analytics.up,
    down: migration_20261115_160000_analytics.down,
    name: '20261115_160000_analytics',
  },
  {
    up: migration_20261115_170000_profile_avatar_alt.up,
    down: migration_20261115_170000_profile_avatar_alt.down,
    name: '20261115_170000_profile_avatar_alt',
  },
  {
    up: migration_20261115_180000_site_features.up,
    down: migration_20261115_180000_site_features.down,
    name: '20261115_180000_site_features',
  },
  {
    up: migration_20261116_030000_posts_autosave.up,
    down: migration_20261116_030000_posts_autosave.down,
    name: '20261116_030000_posts_autosave',
  },
];
