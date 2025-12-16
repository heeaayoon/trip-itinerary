package com.trip.entity;

import java.io.Serializable;
import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Embeddable //엔티티가 아니라, 다른 엔티티에 사용될 객체임
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class TripParticipantId implements Serializable {

    @Column(name = "trip_id")
    private UUID tripId;

    @Column(name = "user_id")
    private UUID userId;
}