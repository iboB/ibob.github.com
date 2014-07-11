class Character
  attr_reader :name, :health

  def initialize(@name)
    @health = 100
  end

  def equip(@weapon)
    puts "#{@name}: I will slash my enemies with my #{@weapon.name}"
  end

  def attack(name)
    puts "#{@name}: Eat my #{@weapon.name}, #{name}"
    enemy = find_character(name)
    enemy.take_damage(@weapon.damage)
  end

  def take_damage(damage)
    @health -= damage
    puts "#{@name}: Aaaarghhhhh"
  end
end
