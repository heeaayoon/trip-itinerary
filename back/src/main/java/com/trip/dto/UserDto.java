package com.trip.dto;

import lombok.Getter;

public class UserDto {

	@Getter
    public static class UserInfoResponse {
        // private UUID id; // 필요하다면 ID도 응답에 포함시킬 수 있습니다.
        private String email;
        private String name;

        public UserInfoResponse(String email, String name) {
            this.email = email;
            this.name = name;
        }
    }
}
