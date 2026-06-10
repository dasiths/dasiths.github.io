source "https://rubygems.org"

# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!

# This site is built with standalone Jekyll (not the `github-pages` gem) so we
# can use a current Jekyll/theme version and a custom GitHub Actions build.
# See .github/workflows/jekyll.yml.
gem "jekyll", "~> 4.3"
gem "minimal-mistakes-jekyll"

# Plugins. Keep this list in sync with the `plugins:` entry in _config.yml.
group :jekyll_plugins do
  gem "jekyll-paginate"
  gem "jekyll-sitemap"
  gem "jekyll-gist"
  gem "jekyll-feed"
  gem "jekyll-include-cache"
  gem "jekyll-redirect-from"
end

# Windows and JRuby do not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows.
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Required for Ruby 3.0+ (no longer part of the default gems).
gem "webrick", "~> 1.8"

