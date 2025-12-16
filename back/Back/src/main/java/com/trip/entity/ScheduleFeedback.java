package com.trip.entity;

import java.sql.Timestamp;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "schedule_feedbacks")
@Getter
@Setter
public class ScheduleFeedback {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "satisfaction_score")
    private Short satisfactionScore;

    @Column(name = "mood_status")
    private String moodStatus;

    @Column(name = "crowd_level")
    private String crowdLevel;

    private String comment;

    @Column(name = "created_at")
    private Timestamp createdAt;
}