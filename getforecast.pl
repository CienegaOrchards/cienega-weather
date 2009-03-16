#!/usr/bin/perl

use WWW::Mechanize;

my $mech = WWW::Mechanize->new;

$mech->get('http://forecast.weather.gov/MapClick.php?w0=t&FcstType=digital&textField1=36.70526&textField2=-121.32623&menu=1');

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

use Data::Dumper;

$Data::Dumper::Sortkeys = 1;

print Dumper \%temp_hash;
