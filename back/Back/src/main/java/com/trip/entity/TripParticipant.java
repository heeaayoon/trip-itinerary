package com.trip.entity;

import java.sql.Timestamp;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "trip_participants")
@Getter
@Setter
public class TripParticipant {

    @EmbeddedId
    private TripParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("tripId") // TripParticipantId의 tripId 필드에 매핑
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId") // TripParticipantId의 userId 필드에 매핑
    @JoinColumn(name = "user_id")
    private User user;

    private String role;

    @Column(name = "joined_at")
    private Timestamp joinedAt;
}