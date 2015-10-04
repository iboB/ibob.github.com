require 'hitimes'

class Timer
  def self.profile(label)
    time = Hitimes::Interval.measure do
      yield
    end

    puts "#{label}: #{time * 1000.0} ms"
  end
end

TESTS = 1000
N = 1000

tests = Array.new(TESTS)
sorted_tests = Array.new(TESTS)

TESTS.times do |i|
  test = Array.new(N)

  N.times do |j|
    test[j] = (Random.rand * 10).floor
  end

  tests[i] = test
  sorted_tests[i] = test.sort
end

usum = 0

Timer.profile("unsorted") do
  tests.each do |test|
    test.each do |t|
      usum += t if t < 5
    end
  end
end

ssum = 0

Timer.profile("sorted") do
  sorted_tests.each do |test|
    test.each do |t|
      ssum += t if t < 5
    end
  end
end

puts usum
puts ssum