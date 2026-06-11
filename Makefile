.PHONY: serve build install clean

serve:
	bundle exec jekyll serve --livereload

build:
	bundle exec jekyll build

install:
	bundle install

clean:
	bundle exec jekyll clean
