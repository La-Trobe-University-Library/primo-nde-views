# Description
This component will show a notice on the 'nde/openurl/' page if:
1. The item defined in the URL doesn't match any in the collection. (i.e. The resource could be a complete fabrication.)

2. The item defined in the URL does match an item in the collection, but the referrer (i.e. domain that the user came from) isn't on a whitelist. (i.e. The resource is likely legitimate, but the user should check its information to be sure.)

# How to use it
This component should be positioned in 'nde-service-page-top'.

You will need the following labels defined:
- nui.record.unmatched - This is the HTML shown within the notice when the resource doesn't match any item in the collection. Set as '-' (or remove the label) to prevent the notice from being shown.

- nui.record.questionable - This is the HTML shown within the notice when a match has been found in the collection but the domain that the user came from isn't on our whitelist. Set as '-' (or remove the label) to prevent the notice from being shown.

- nui.record.legitimate_whitelist - A comma-separated list of domains that we know are legitimate (e.g. our instance of Primo).