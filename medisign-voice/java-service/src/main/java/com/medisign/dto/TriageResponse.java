package com.medisign.dto;

public class TriageResponse {
    private int score;
    private String urgency;
    private String reason;
    private String source = "java-triage-engine";

    public TriageResponse() {}

    public TriageResponse(int score, String urgency, String reason) {
        this.score = score;
        this.urgency = urgency;
        this.reason = reason;
    }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getUrgency() { return urgency; }
    public void setUrgency(String urgency) { this.urgency = urgency; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
