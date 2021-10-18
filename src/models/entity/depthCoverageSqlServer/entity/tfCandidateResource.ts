import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('AMEClientTools_Coverage_TFCandidateResources')
export class TfCandidateResource {
    @PrimaryColumn()
    resourceProvider: string;
    @Column({ nullable: true })
    fullResourceType: string;
    @Column({ nullable: true })
    fileName: string;
    @Column({ nullable: true })
    apiVersion: string;
    @Column({ nullable: true })
    tag: string;
    @Column({ nullable: true })
    startDate: string;
    @Column({ nullable: true })
    endDate: string;
}
