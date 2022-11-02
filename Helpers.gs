function getCasesText(thisScubaSprint) {
	var casesList = [];
	var casesText;
	var theseCases = Salesforce.soqlRequest("SELECT Id, Record_Link__c, Subject, Status FROM Case WHERE SCUBA_Sprint__c = '" + thisScubaSprint.Id + "'");
	if (theseCases && theseCases.totalSize > 0) {
		casesList.push("<b>Cases</b>")
		theseCases.records.forEach(function(thisCase, index) {
			var row = Number(index + 1).toString();
			var linkText = "<a href='" + thisCase.Record_Link__c + "'>" + row + ". " + thisCase.Subject + " (" + thisCase.Status +")" + "</a>"
			casesList.push(linkText);
		});
		if (casesList.length > 0) {
			casesText = casesList.join("\n").toString();
		}
	}
  return casesText;
}
