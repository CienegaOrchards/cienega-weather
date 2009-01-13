#!/usr/bin/perl

use strict;
use warnings;
use Net::OSCAR qw(:all);

my $screenname = 'cienegaweather';
my $password = 'saywhat123';

sub print_groups {
	my($oscar) = @_;
	my @groups = qw / Admin IM SMS /;
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
	my ($command,$arg1) = split / /,$message;
	my @admins = $oscar->buddies("Admin");
	return unless (grep {$_ eq $sender} @admins);
	if($command =~ /list_groups/)
	{
		print_groups($oscar);
	}
	if($command =~ /add_admin/)
	{
		$oscar->add_buddy("Admin",$arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /add_im/)
	{
		$oscar->add_buddy("IM",$arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /add_sms/)
	{
		$oscar->add_buddy("SMS",$arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /remove_admin/)
	{
		$oscar->remove_buddy("Admin",$arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /remove_im/)
	{
		$oscar->remove_buddy("IM",$arg1);
		$oscar->commit_buddylist();
		print_groups($oscar);
	}
	if($command =~ /remove_sms/)
	{
		$oscar->remove_buddy("SMS",$arg1);
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
#$oscar->loglevel(OSCAR_DBG_INFO);
$oscar->set_callback_im_in(\&im_in);
$oscar->set_callback_signon_done(\&signon_done);
$oscar->set_callback_buddylist_ok(\&on_buddylist_ok);
$oscar->set_callback_buddylist_error(\&on_buddylist_error);
$oscar->signon($screenname, $password);

while(1) {
	$oscar->do_one_loop();
}
