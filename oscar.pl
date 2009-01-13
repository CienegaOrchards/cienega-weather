#!/usr/bin/perl

use strict;
use warnings;
use Net::OSCAR qw(:all);

my $screenname = 'cienegaweather';
my $password = 'saywhat123';

sub print_groups {
	my($oscar) = @_;
	my @groups = $oscar->groups();
	foreach my $group (@groups)
	{
		print "$group: ",join(',',$oscar->buddies($group)),"\n";
	}
}

sub on_buddylist_ok {
	my($oscar) = @_;
	print "Buddy list OK\n";
}

sub on_buddylist_error {
	my($oscar, $error, $what) = @_;
	print "Buddy list failed: $error: $what\n";
}

sub im_in {
	my($oscar, $sender, $message, $is_away) = @_;
	$message =~ s/\<[^>]*\>//g;
	print "[AWAY] " if $is_away;
	print "$sender: $message\n";
	$sender =~ /hugh3scr/ or return;
	my ($command,$arg1,$arg2) = split /,/,$message;
	if($command =~ /list_groups/)
	{
		print_groups($oscar);
	}
	if($command =~ /add_group/)
	{
		$oscar->add_group($arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /add_buddy/)
	{
		$oscar->add_buddy($arg1,$arg2);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /remove_buddy/)
	{
		$oscar->remove_buddy($arg1,$arg2);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /remove_group/)
	{
		$oscar->remove_group($arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
}

sub signon_done {
	my $oscar = shift;
	#print "Sending message number ",$oscar->send_im("+16508514450","This is a test!"),"\n";
}

sub im_ok {
	my($oscar,$to,$reqid) = @_;
	print "Msg $reqid sent OK to $to\n";
}

sub on_error {
	my($oscar, $conn, $error, $description, $fatal) = @_;
	print "Error: $description\n";
	exit if $fatal;
}

my $oscar = Net::OSCAR->new();
$oscar->loglevel(OSCAR_DBG_INFO);
$oscar->set_callback_im_in(\&im_in);
$oscar->set_callback_signon_done(\&signon_done);
$oscar->set_callback_buddylist_ok(\&on_buddylist_ok);
$oscar->set_callback_buddylist_error(\&on_buddylist_error);
$oscar->signon($screenname, $password);

while(1) {
	$oscar->do_one_loop();
}
