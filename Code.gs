function doSync() {
	var config = new Config();
	var theseScubaSprints = Salesforce.soqlRequest("SELECT Id, Date__c, Google_Calendar_Event_Ical_Id__c,Google_Calendar_Title__c,Record_Link__c,Total_Cases__c,Total_Hours__c, Name, Total_Open_Cases__c, Total_Closed_Cases__c, Average_Case_Age__c, Progress__c FROM SCUBA_Sprint__c WHERE Google_Calendar_Include_in_Query__c = TRUE");
	if (theseScubaSprints && theseScubaSprints.totalSize > 0) {
		var calendar = CalendarApp.getCalendarById(config.calendarId);
		if (calendar) {
			theseScubaSprints.records.forEach(function(thisScubaSprint) {
				var thisEvent;
				var casesText = getCasesText(thisScubaSprint);
				var description = ["<b>SCUBA Sprint Link:</b> " + thisScubaSprint.Record_Link__c, "Progress (%): " + +thisScubaSprint.Progress__c, "Total Cases: " + thisScubaSprint.Total_Cases__c, "Total Open Cases: " + thisScubaSprint.Total_Open_Cases__c, "Total Closed Cases: " + thisScubaSprint.Total_Closed_Cases__c, "Total Hours: " + thisScubaSprint.Total_Hours__c, "Event Last Updated: " + new Date().toISOString(),
					casesText
				].join("\n").toString();
				//UPDATE
				if (thisScubaSprint.Google_Calendar_Event_Ical_Id__c) {
					thisEvent = calendar.getEventById(thisScubaSprint.Google_Calendar_Event_Ical_Id__c);
					if (thisEvent) {
						thisEvent.setDescription(description);
						thisEvent.setTitle(thisScubaSprint.Google_Calendar_Title__c);
					}
				}
				//CREATE
				else {
					var sheetId;
					var sheet;
					var sheetLink;
					var docId;
					var doc;
					var docLink;
					thisEvent = calendar.createAllDayEvent(thisScubaSprint.Google_Calendar_Title__c, new Date(new Date(thisScubaSprint.Date__c).getFullYear(), new Date(thisScubaSprint.Date__c).getMonth(), new Date(thisScubaSprint.Date__c).getDate() + 1), {
						description: description
					});
					if (thisEvent) {
						//SHEET
						var sheetResource = {
							title: thisScubaSprint.Name + " - Sheet",
							mimeType: MimeType.GOOGLE_SHEETS,
							parents: [{
								id: config.folderId
							}],
							description: ["SCUBA Sprint Link: " + thisScubaSprint.Record_Link__c].join("\n").toString()
						};
						sheetId = Drive.Files.insert(sheetResource).id;
						if (sheetId) {
							sheet = DriveApp.getFileById(sheetId);
							sheetLink = sheet.getUrl();
							SpreadsheetApp.openById(sheetId).getSheetByName('Sheet1').getRange(1, 1, 1, 2).setValues([
								['SCUBA Sprint Link: ', thisScubaSprint.Record_Link__c]
							]);
						}
						//DOC
						var docResource = {
							title: thisScubaSprint.Name + " - Doc",
							mimeType: MimeType.GOOGLE_DOCS,
							description: ["SCUBA Sprint Link: " + thisScubaSprint.Record_Link__c].join("\n").toString(),
							parents: [{
								id: config.folderId
							}]
						};
						docId = Drive.Files.insert(docResource).id;
						if (docId) {
							doc = DriveApp.getFileById(docId);
							docLink = doc.getUrl();
							DocumentApp.openById(docId).getBody()
              .appendParagraph(thisScubaSprint.Name)
              .setLinkUrl(thisScubaSprint.Record_Link__c);
							//DocumentApp.openById(docId).getBody().appendParagraph("SCUBA Sprint Link: " + thisScubaSprint.Record_Link__c);
						}
						Salesforce.recordUpdate({
							object: 'SCUBA_Sprint__c',
							id: thisScubaSprint.Id,
							payload: {
								Google_Calendar_Event_Ical_Id__c: thisEvent.getId(),
								Google_Doc_Link__c: docLink,
								Google_Sheet_Link__c: sheetLink
							}
						});
						thisEvent.setTag('scubaSprintId', thisScubaSprint.Id);
					}
				}
			})
		}
	}
}
