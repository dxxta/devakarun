import * as migration_20261111_124718_initial from './20261111_124718_initial';
import * as migration_20261112_005843_highlight from './20261112_005843_highlight';
import * as migration_20261112_011916_github_language from './20261112_011916_github_language';
import * as migration_20261112_022325_project_readme_sections from './20261112_022325_project_readme_sections';
import * as migration_20261112_023016_project_preview_source from './20261112_023016_project_preview_source';
import * as migration_20261112_032259_profile_list_previews from './20261112_032259_profile_list_previews';
import * as migration_20261112_041322_portfolio_showcases from './20261112_041322_portfolio_showcases';

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
    name: '20261112_041322_portfolio_showcases'
  },
];
