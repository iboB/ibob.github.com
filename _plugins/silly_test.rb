# Just a reminder that custom plugins don't work with GitHub pages
module Jekyll
  class SillyGen < Generator
    def generate(site)
      puts 'o_O'
      raise '\o_'
    end
  end
end
