#!/usr/bin/perl

use Net::SMS;

$sms->subscriberID("123-456-789-12345");
$sms->subscriberPassword("Password Goes Here");

# Message Settings
$sms->msgPin("+1 100 510 1234");
$sms->msgFrom("Demo");
$sms->msgCallback("+1 100 555 1212");
$sms->msgText("Hello World From Simplewire!");

print "Sending message to Simplewire...\n";
# Send Message
$sms->msgSend();

# Check For Errors

if ($sms->success)
{
	print "Message was sent!\n";
} else {
	print "Message was not sent!\n";
	print "Error Code: " . $sms->errorCode() . "\n";
	print "Error Description: " . $sms->errorDesc() . "\n";
	print "Error Resolution: " . $sms->errorResolution() . "\n";
}
