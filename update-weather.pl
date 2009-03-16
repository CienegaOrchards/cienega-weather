#!/usr/bin/perl

use strict;
use warnings;

use IO::File;
use RRD::Simple;
use Date::Manip;
use Expect;


my $rrd_file = 'weather.rrd';

my $rrd = RRD::Simple->new( file => $rrd_file );


my $port = '/dev/ttyUSB0';

my $fh = new IO::File("+<$port");

my $exp = Expect->exp_init($fh);

$exp->stty(qw(9600 raw -echo));
#$exp->slave->stty(qw(9600 raw -echo));

$exp->log_file("weather_data.log");

# First set time to current time in case clock got lost or drifted
print $exp UnixDate(ParseDate("now"),":K%m%d%H%M%S\n");
$exp->expect(10, [ qr/OK/ => sub {
					my $exp = shift;
					print "Clock set to current time OK\n";
				} ],
	);


print $exp ":O";

$exp->expect(10,
		[ qr/>/ => sub {
					my $exp = shift;
					print "Got prompt\n";
					$exp->exp_continue;
				} ],
		[ qr/H,.*\n/ => sub	{
					my $exp = shift;
					print "Got header line\n";
					$exp->exp_continue;
				 } ],
		[ qr/M,.*\n/ => sub	{
					my $exp = shift;
					print "Got midnight line\n";
					$exp->exp_continue;
				 } ],
		[ qr/E(?=.*\n)/ => sub	{
					my $exp = shift;
					if($exp->after !~ /(Clock set|New clock time)/i)
					{
						print "Got error line: ",$exp->after,"\n";
					}
					$exp->exp_continue;
				 } ],
		[ qr/D,(?=.*\n)/ => sub {
					my $exp = shift;
					weather_parse($exp->after);
					$exp->exp_continue;
				} ],
		[ qr/OK/ => sub {
					my $exp = shift;
					$exp->send(":Z");
				} ],

	);

$exp->expect(10,
		[ qr/OK/ => sub {
					my $exp = shift;
					print "Data log cleared OK\n";
				} ],
	);

sub weather_parse
{
	my $line = shift;

	my ($date,$time,$temp,$hum,$pressure,$wind_dir,$wind_spd,$wind_spd_hi,$rainfall,$batt,$chill,$crc) = split /,/,$line;
	
	my $timestamp = UnixDate(ParseDate("$date $time"),"%s");
	if($timestamp > UnixDate(ParseDate("now"),"%s"))
	{
		print "Got data item which looks like it was last year\n";
		my $year = UnixDate(ParseDate("now"),"%Y")-1;
		$timestamp = UnixDate(ParseDate("$date/$year $time"),"%s");
	}

	print "$date\t$time\t$temp\t$chill\t$hum\t$pressure\t$wind_spd\t$rainfall\n";
	eval { $rrd->update($timestamp,
			temperature => $temp,
			humidity => $hum,
			pressure => $pressure,
			wind_dir => $wind_dir,
			wind_spd => $wind_spd,
			rainfall => $rainfall*100,
			chill => $chill
		);
		};
			
}
