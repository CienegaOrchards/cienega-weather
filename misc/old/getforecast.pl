#!/usr/bin/perl

use WWW::Mechanize;

my $mech = WWW::Mechanize->new;

$mech->get('http://forecast.weather.gov/MapClick.php?w0=t&FcstType=digital&textField1=36.704788132826586&textField2=-121.32691383361816&menu=1');

use HTML::TableExtract;

my $te = HTML::TableExtract->new( depth => 0, count => 5);
$te->parse($mech->content());

my %temp_hash;

foreach my $ts ($te->tables) {
	print "Table (", join(',', $ts->coords), "):\n";
	my $hours = ($ts->rows)[2];
	my $temps = ($ts->rows)[3];
	for(my $i=1; $i < scalar(@$hours); $i++)
	{
		$temp_hash{(@$hours)[$i]} = (@$temps)[$i];
	}
}

# Find lowest forecast temp from midnight through 8am
my $min_temp = "00";
foreach my $i (qw (01 02 03 04 05 06 07 08)) {
	$min_temp = $i if $temp_hash{$i} <= $temp_hash{$min_temp};
}

use Data::Dumper;

$Data::Dumper::Sortkeys = 1;
$Data::Dumper::Indent = 0;

print Dumper \%temp_hash;
print "\nMin temp is $temp_hash{$min_temp} at $min_temp o'clock\n";

open(LOG,">>forecast_data.log");

use Date::Manip;

print LOG ParseDate('now'),"\tForecast min is $temp_hash{$min_temp} at $min_temp o'clock\n";
print LOG ParseDate('now'),"\t",Dumper(\%temp_hash),"\n";
